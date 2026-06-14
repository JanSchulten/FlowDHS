import type { Project, Schedule, ScheduleSlot, Settings } from '../types';
import { uid, addMins, timeDiff, todayKey, dateKey } from './utils';

interface TaskItem {
  projectId: string;
  subtaskId: string | null;
  label: string;
  dur: number;
  tag: string;
}

function collectTasksForDate(
  projects: Project[],
  overrides: { prepend?: TaskItem[] } = {}
): TaskItem[] {
  const result: TaskItem[] = [];

  const active = [...projects]
    .filter((p) => !p.done)
    .sort((a, b) => {
      const prioVal: Record<string, number> = { high: 0, med: 1, low: 2 };
      const pd = prioVal[a.priority ?? 'med'] - prioVal[b.priority ?? 'med'];
      if (pd !== 0) return pd;
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

  for (const p of active) {
    if (p.subtasks && p.subtasks.length > 0) {
      for (const st of p.subtasks.filter((s) => !s.done)) {
        result.push({
          projectId: p.id,
          subtaskId: st.id,
          label: `${p.name} → ${st.name}`,
          dur: st.dur ?? 25,
          tag: p.tag,
        });
      }
    } else {
      result.push({
        projectId: p.id,
        subtaskId: null,
        label: p.name,
        dur: Math.min(p.estimateMins ?? 60, 45),
        tag: p.tag,
      });
    }
  }

  if (overrides.prepend) result.unshift(...overrides.prepend);
  return result;
}

export function planDay(
  _dateStr: string,
  projects: Project[],
  settings: Settings,
  overrides: { prepend?: TaskItem[] } = {}
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  let cur = settings.start;
  let blockCount = 0;
  let blockStreak = 0;

  const tasks = collectTasksForDate(projects, overrides);

  for (const t of tasks) {
    if (timeDiff(cur, settings.end) < 10) break;
    if (blockCount >= settings.maxBlocks) break;

    const dur = t.dur ?? 25;
    const end = addMins(cur, dur);
    if (timeDiff(end, settings.end) < 0) break;

    slots.push({
      id: uid(),
      projectId: t.projectId,
      subtaskId: t.subtaskId ?? null,
      label: t.label,
      type: 'task',
      start: cur,
      end,
      done: false,
      missed: false,
      dur,
      tag: t.tag as never,
    });
    cur = end;
    blockCount++;
    blockStreak++;

    if (timeDiff(cur, settings.end) > 0) {
      const breakDur = blockStreak % 3 === 0 ? settings.breakL : settings.breakS;
      const bEnd = addMins(cur, breakDur);
      slots.push({
        id: uid(),
        type: 'break',
        label: blockStreak % 3 === 0 ? '☕ Lange Pause' : '🧘 Kurze Pause',
        start: cur,
        end: bEnd,
        dur: breakDur,
        done: false,
        missed: false,
      });
      cur = bEnd;
    }
  }

  return slots;
}

export function planWeek(
  projects: Project[],
  settings: Settings,
  existingSchedule: Schedule
): Schedule {
  const now = new Date();
  const next: Schedule = { ...existingSchedule };
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dk = dateKey(d);
    next[dk] = planDay(dk, projects, settings);
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
  settings: Settings
): Schedule {
  const key = todayKey();
  const missed = (schedule[key] ?? []).filter((s) => s.type === 'task' && !s.done && s.missed);
  if (!missed.length) return schedule;

  const now = new Date();
  let next = { ...schedule };

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
      next[dk] = planDay(dk, projects, settings, { prepend });
      break;
    }
  }

  return next;
}
