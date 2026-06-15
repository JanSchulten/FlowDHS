import type { Project, Schedule, ScheduleSlot, Settings, Fixture } from '../types';
import { uid, addMins, timeDiff, todayKey, dateKey } from './utils';

interface TaskItem {
  projectId: string;
  subtaskId: string | null;
  label: string;
  dur: number;
  tag: string;
}

const prioVal: Record<string, number> = { high: 0, med: 1, low: 2 };

function sortActive(projects: Project[]): Project[] {
  return [...projects]
    .filter((p) => !p.done)
    .sort((a, b) => {
      const pd = prioVal[a.priority ?? 'med'] - prioVal[b.priority ?? 'med'];
      if (pd !== 0) return pd;
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
}

function projectTasks(p: Project): TaskItem[] {
  if (p.subtasks && p.subtasks.length > 0) {
    return p.subtasks.filter((s) => !s.done).map((st) => ({
      projectId: p.id, subtaskId: st.id, label: `${p.name} → ${st.name}`, dur: st.dur ?? 25, tag: p.tag,
    }));
  }
  return [{ projectId: p.id, subtaskId: null, label: p.name, dur: Math.min(p.estimateMins ?? 60, 45), tag: p.tag }];
}

function collectTasks(projects: Project[], overrides: { prepend?: TaskItem[] } = {}): TaskItem[] {
  const result: TaskItem[] = [];
  for (const p of sortActive(projects)) result.push(...projectTasks(p));
  if (overrides.prepend) result.unshift(...overrides.prepend);
  return result;
}

/* ── Fixture helpers ── */

const mins = (t: string): number => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

function weekdayOf(dateStr: string): number {
  // Noon avoids any timezone/DST edge shifting the weekday.
  return new Date(`${dateStr}T12:00:00`).getDay();
}

export function fixturesForDate(fixtures: Fixture[], dateStr: string): Fixture[] {
  const wd = weekdayOf(dateStr);
  return fixtures
    .filter((f) => (f.days && f.days.length > 0 ? f.days.includes(wd) : f.date === dateStr))
    .filter((f) => timeDiff(f.start, f.end) > 0)
    .sort((a, b) => mins(a.start) - mins(b.start));
}

interface Interval { start: string; end: string }

// First time >= cur that is not inside any busy interval.
function nextFree(cur: string, busy: Interval[]): string {
  let c = cur;
  for (let guard = 0; guard < 50; guard++) {
    const hit = busy.find((b) => mins(c) >= mins(b.start) && mins(c) < mins(b.end));
    if (!hit) return c;
    c = hit.end;
  }
  return c;
}

// End of the free gap that starts at cur: the next busy start after cur, else dayEnd.
function gapEnd(cur: string, busy: Interval[], dayEnd: string): string {
  let end = dayEnd;
  for (const b of busy) {
    if (mins(b.start) >= mins(cur) && mins(b.start) < mins(end)) end = b.start;
  }
  return end;
}

function fixedSlot(f: Fixture): ScheduleSlot {
  return {
    id: uid(),
    type: 'fixed',
    label: f.name,
    start: f.start,
    end: f.end,
    dur: timeDiff(f.start, f.end),
    done: false,
    missed: false,
    tag: f.tag,
    fixtureKind: f.kind,
    locked: f.kind === 'block',
  };
}

export function planDay(
  dateStr: string,
  projects: Project[],
  settings: Settings,
  fixtures: Fixture[] = [],
  overrides: { prepend?: TaskItem[] } = {}
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const todays = fixturesForDate(fixtures, dateStr);
  const busy: Interval[] = todays.map((f) => ({ start: f.start, end: f.end }));

  // 1) Render every fixture as a fixed slot (the appointment band).
  for (const f of todays) slots.push(fixedSlot(f));

  // 2) Fill container fixtures with their assigned projects' tasks.
  for (const f of todays.filter((x) => x.kind === 'container')) {
    const assigned = sortActive(projects).filter((p) => p.fixtureId === f.id);
    let cur = f.start;
    for (const p of assigned) {
      for (const t of projectTasks(p)) {
        const end = addMins(cur, t.dur);
        if (timeDiff(end, f.end) < 0) break;
        slots.push({
          id: uid(), type: 'task', projectId: t.projectId, subtaskId: t.subtaskId,
          label: t.label, start: cur, end, dur: t.dur, done: false, missed: false, tag: t.tag as never,
        });
        cur = end;
      }
    }
  }

  // 3) Schedule free projects (no container assignment) into the open gaps,
  //    flowing around all fixtures, with breaks and the daily block cap.
  const containerIds = new Set(todays.filter((f) => f.kind === 'container').map((f) => f.id));
  const freeProjects = projects.filter((p) => !p.fixtureId || !containerIds.has(p.fixtureId));
  const tasks = collectTasks(freeProjects, overrides);

  let cur = settings.start;
  let blockCount = 0;
  let blockStreak = 0;
  let i = 0;
  while (i < tasks.length && blockCount < settings.maxBlocks) {
    cur = nextFree(cur, busy);
    if (timeDiff(cur, settings.end) < 10) break;
    const ge = gapEnd(cur, busy, settings.end);
    const t = tasks[i];
    const end = addMins(cur, t.dur);

    if (timeDiff(end, ge) < 0) {
      // Task doesn't fit in this gap → skip past the blocking fixture.
      if (mins(ge) >= mins(settings.end)) break;
      cur = ge;
      continue;
    }

    slots.push({
      id: uid(), type: 'task', projectId: t.projectId, subtaskId: t.subtaskId,
      label: t.label, start: cur, end, dur: t.dur, done: false, missed: false, tag: t.tag as never,
    });
    cur = end; blockCount++; blockStreak++; i++;

    // Insert a break only if it fits before the gap ends.
    if (timeDiff(cur, settings.end) > 0) {
      const breakDur = blockStreak % 3 === 0 ? settings.breakL : settings.breakS;
      if (timeDiff(addMins(cur, breakDur), ge) >= 0) {
        const bEnd = addMins(cur, breakDur);
        slots.push({
          id: uid(), type: 'break',
          label: blockStreak % 3 === 0 ? '☕ Lange Pause' : '🧘 Kurze Pause',
          start: cur, end: bEnd, dur: breakDur, done: false, missed: false,
        });
        cur = bEnd;
      }
    }
  }

  // Single timeline, ordered by start; fixed bands win ties so they read as headers.
  return slots.sort((a, b) => {
    const d = mins(a.start) - mins(b.start);
    if (d !== 0) return d;
    if (a.type === 'fixed' && b.type !== 'fixed') return -1;
    if (b.type === 'fixed' && a.type !== 'fixed') return 1;
    return 0;
  });
}

export function planWeek(
  projects: Project[],
  settings: Settings,
  existingSchedule: Schedule,
  fixtures: Fixture[] = []
): Schedule {
  const now = new Date();
  const next: Schedule = { ...existingSchedule };
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dk = dateKey(d);
    next[dk] = planDay(dk, projects, settings, fixtures);
  }
  return next;
}

export function checkMissed(schedule: Schedule): Schedule {
  const key = todayKey();
  const slots = schedule[key] ?? [];
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updated = slots.map((s) => {
    if (s.type === 'task' && !s.done && s.end < nowStr) {
      return { ...s, missed: true };
    }
    return s;
  });

  return { ...schedule, [key]: updated };
}

export function autoReschedule(
  schedule: Schedule,
  projects: Project[],
  settings: Settings,
  fixtures: Fixture[] = []
): Schedule {
  const key = todayKey();
  const missed = (schedule[key] ?? []).filter((s) => s.type === 'task' && !s.done && s.missed);
  if (!missed.length) return schedule;

  const now = new Date();
  const next = { ...schedule };

  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dk = dateKey(d);
    const existing = (next[dk] ?? []).filter((s) => s.type === 'task');
    if (existing.length < settings.maxBlocks) {
      const prepend: TaskItem[] = missed.map((m) => ({
        projectId: m.projectId!,
        subtaskId: m.subtaskId ?? null,
        label: m.label,
        dur: m.dur,
        tag: m.tag ?? 'focus',
      }));
      next[dk] = planDay(dk, projects, settings, fixtures, { prepend });
      break;
    }
  }

  return next;
}
