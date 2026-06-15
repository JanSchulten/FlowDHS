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

function taskSlot(t: TaskItem, start: string, end: string): ScheduleSlot {
  return {
    id: uid(), type: 'task', projectId: t.projectId, subtaskId: t.subtaskId,
    label: t.label, start, end, dur: t.dur, done: false, missed: false, tag: t.tag as never,
  };
}

/* ── Shared task pools (consumed across days so a week distributes, not duplicates) ── */

interface Pools {
  work: TaskItem[];
  priv: TaskItem[];
  containers: Map<string, TaskItem[]>; // fixtureId → tasks
}

function buildPools(projects: Project[], settings: Settings, overrides: { prepend?: TaskItem[] } = {}): Pools {
  const active = sortActive(projects);

  // Tasks bound to a container fixture only ever fill that fixture.
  const containers = new Map<string, TaskItem[]>();
  for (const p of active) {
    if (p.fixtureId) {
      const arr = containers.get(p.fixtureId) ?? [];
      arr.push(...projectTasks(p));
      containers.set(p.fixtureId, arr);
    }
  }

  const hasPrivate = !!(settings.privateStart && settings.privateEnd);
  const free = active.filter((p) => !p.fixtureId);
  const workProjects = hasPrivate ? free.filter((p) => p.workContext !== 'private') : free;
  const privProjects = hasPrivate ? free.filter((p) => p.workContext === 'private') : [];

  const work: TaskItem[] = [];
  for (const p of workProjects) work.push(...projectTasks(p));
  if (overrides.prepend) work.unshift(...overrides.prepend);

  const priv: TaskItem[] = [];
  for (const p of privProjects) priv.push(...projectTasks(p));

  return { work, priv, containers };
}

// Fills a fixed container window back-to-back, consuming from its pool.
function fillContainer(pool: TaskItem[], start: string, end: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  let cur = start;
  while (pool.length > 0) {
    const t = pool[0];
    const tEnd = addMins(cur, t.dur);
    if (timeDiff(tEnd, end) < 0) break; // doesn't fit before the window closes
    slots.push(taskSlot(t, cur, tEnd));
    pool.shift();
    cur = tEnd;
  }
  return slots;
}

// Fills [windowStart, windowEnd] flowing around busy intervals, with breaks and a daily cap.
// Consumes from `pool`; tasks that don't fit today stay in the pool for the next day.
function fillWindow(
  pool: TaskItem[],
  windowStart: string,
  windowEnd: string,
  busy: Interval[],
  maxBlocks: number,
  breakS: number,
  breakL: number,
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  let cur = windowStart;
  let blockCount = 0;
  let blockStreak = 0;

  while (pool.length > 0 && blockCount < maxBlocks) {
    cur = nextFree(cur, busy);
    if (timeDiff(cur, windowEnd) < 10) break;
    const ge = gapEnd(cur, busy, windowEnd);
    const t = pool[0];
    const end = addMins(cur, t.dur);

    if (timeDiff(end, ge) < 0) {
      // Task doesn't fit in this gap → jump past the blocking fixture and retry.
      if (mins(ge) >= mins(windowEnd)) break;
      cur = ge;
      continue;
    }

    slots.push(taskSlot(t, cur, end));
    pool.shift();
    cur = end; blockCount++; blockStreak++;

    if (timeDiff(cur, windowEnd) > 0) {
      const breakDur = blockStreak % 3 === 0 ? breakL : breakS;
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

  return slots;
}

function sortTimeline(slots: ScheduleSlot[]): ScheduleSlot[] {
  return slots.sort((a, b) => {
    const d = mins(a.start) - mins(b.start);
    if (d !== 0) return d;
    if (a.type === 'fixed' && b.type !== 'fixed') return -1;
    if (b.type === 'fixed' && a.type !== 'fixed') return 1;
    return 0;
  });
}

// Plans a single day, consuming from shared pools (so callers can spread a week).
function planDayInto(dateStr: string, settings: Settings, fixtures: Fixture[], pools: Pools): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const todays = fixturesForDate(fixtures, dateStr);
  const busy: Interval[] = todays.map((f) => ({ start: f.start, end: f.end }));

  // 1) Render every fixture as a fixed band.
  for (const f of todays) slots.push(fixedSlot(f));

  // 2) Fill container fixtures from their dedicated pools.
  for (const f of todays.filter((x) => x.kind === 'container')) {
    const pool = pools.containers.get(f.id);
    if (pool && pool.length) slots.push(...fillContainer(pool, f.start, f.end));
  }

  // 3) Work window (free work projects), avoiding fixtures + private time.
  const hasPrivate = !!(settings.privateStart && settings.privateEnd);
  const privBusy: Interval[] = hasPrivate ? [{ start: settings.privateStart!, end: settings.privateEnd! }] : [];
  const workSlots = fillWindow(
    pools.work, settings.start, settings.end,
    [...busy, ...privBusy], settings.maxBlocks, settings.breakS, settings.breakL,
  );
  slots.push(...workSlots);

  // 4) Private window (free private projects), avoiding fixtures + already-placed work.
  if (hasPrivate && pools.priv.length) {
    const scheduledBusy = workSlots.map((s) => ({ start: s.start, end: s.end }));
    const pvSlots = fillWindow(
      pools.priv, settings.privateStart!, settings.privateEnd!,
      [...busy, ...scheduledBusy], settings.maxBlocks, settings.breakS, settings.breakL,
    );
    slots.push(...pvSlots);
  }

  return sortTimeline(slots);
}

export function planDay(
  dateStr: string,
  projects: Project[],
  settings: Settings,
  fixtures: Fixture[] = [],
  overrides: { prepend?: TaskItem[] } = {}
): ScheduleSlot[] {
  const pools = buildPools(projects, settings, overrides);
  return planDayInto(dateStr, settings, fixtures, pools);
}

export function planWeek(
  projects: Project[],
  settings: Settings,
  existingSchedule: Schedule,
  fixtures: Fixture[] = []
): Schedule {
  // One shared pool for the whole week → tasks spread across days (weekdays first),
  // instead of being duplicated identically onto every day.
  const pools = buildPools(projects, settings);
  const now = new Date();
  const next: Schedule = { ...existingSchedule };
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dk = dateKey(d);
    next[dk] = planDayInto(dk, settings, fixtures, pools);
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
