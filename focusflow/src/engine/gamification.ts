import type { Achievement, Stats } from '../types';

/** XP awarded per dopamine-relevant action. Small, frequent rewards work best for ADHD. */
export const XP = {
  subtask: 12,
  project: 60,
  pomodoro: 25,
  brainDump: 3,
  breakdown: 8,
  plan: 5,
  quickTask: 8,
} as const;

/**
 * Level curve: each level costs a bit more than the last, but early levels come
 * fast (frequent dopamine hits). Cumulative XP needed to *reach* a level.
 */
export function xpForLevel(level: number): number {
  // level 1 = 0, level 2 = 100, level 3 = 260, level 4 = 480, ...
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= level; l++) total += 80 + (l - 1) * 40;
  return total;
}

export function levelFromXp(xp: number): {
  level: number;
  curBase: number;
  nextAt: number;
  progress: number;
} {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const curBase = xpForLevel(level);
  const nextAt = xpForLevel(level + 1);
  const span = nextAt - curBase || 1;
  const progress = Math.min(1, (xp - curBase) / span);
  return { level, curBase, nextAt, progress };
}

export const LEVEL_TITLES = [
  'Funke', 'Anfänger:in', 'Fokus-Lehrling', 'Flow-Finder:in', 'Tagessieger:in',
  'Deep-Worker', 'Momentum-Meister:in', 'Fokus-Profi', 'Flow-Architekt:in', 'Legende',
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? 'Legende';
}

/** Master list of achievements. `unlockedAt` lives in state; this is the catalog. */
export const ACHIEVEMENT_CATALOG: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_step', name: 'Erster Schritt', desc: 'Erste Unteraufgabe erledigt', icon: '👟' },
  { id: 'first_win', name: 'Erster Sieg', desc: 'Erstes Projekt abgeschlossen', icon: '🏆' },
  { id: 'focus_5', name: 'Fokus-Flow', desc: '5 Pomodoro-Runden geschafft', icon: '🎯' },
  { id: 'streak_3', name: 'Dranbleiber:in', desc: '3er-Streak erreicht', icon: '🔥' },
  { id: 'streak_7', name: 'Wochen-Held:in', desc: '7er-Streak erreicht', icon: '⚡' },
  { id: 'dump_10', name: 'Kopf frei', desc: '10 Gedanken im Brain-Dump erfasst', icon: '🧠' },
  { id: 'breakdown', name: 'Zerleger:in', desc: 'Großes Projekt in Schritte zerlegt', icon: '🪓' },
  { id: 'level_5', name: 'Aufgestiegen', desc: 'Level 5 erreicht', icon: '🌟' },
  { id: 'deep_120', name: 'Tiefenarbeit', desc: '120 Minuten fokussiert', icon: '🌊' },
  { id: 'clean_sweep', name: 'Aufgeräumt', desc: '5 Projekte abgeschlossen', icon: '✨' },
];

/** Returns ids that *should* be unlocked given the current stats/level/streak. */
export function evaluateAchievements(
  stats: Stats,
  level: number,
  streak: number,
  hasBreakdown: boolean
): string[] {
  const unlocked: string[] = [];
  if (stats.subtasksDone >= 1) unlocked.push('first_step');
  if (stats.projectsDone >= 1) unlocked.push('first_win');
  if (stats.pomodoros >= 5) unlocked.push('focus_5');
  if (streak >= 3) unlocked.push('streak_3');
  if (streak >= 7) unlocked.push('streak_7');
  if (stats.brainDumps >= 10) unlocked.push('dump_10');
  if (hasBreakdown) unlocked.push('breakdown');
  if (level >= 5) unlocked.push('level_5');
  if (stats.focusMins >= 120) unlocked.push('deep_120');
  if (stats.projectsDone >= 5) unlocked.push('clean_sweep');
  return unlocked;
}
