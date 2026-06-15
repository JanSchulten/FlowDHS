export interface Subtask {
  id: string;
  name: string;
  dur: number; // minutes
  done: boolean;
}

export type Priority = 'high' | 'med' | 'low';
export type Tag = 'focus' | 'creative' | 'energy' | 'admin';

/** Kanban / board column the project currently lives in. */
export type BoardStatus = 'backlog' | 'today' | 'doing' | 'done';

export interface Project {
  id: string;
  name: string;
  deadline: string | null;
  weekBudgetH: number;
  estimateMins: number;
  priority: Priority;
  tag: Tag;
  done: boolean;
  subtasks: Subtask[];
  createdAt: number;
  /** Board column. Defaults to 'backlog'. */
  status: BoardStatus;
  /** Minutes actually focused on this project (time-blindness aid). */
  actualMins: number;
  /** Optional short note / context. */
  note?: string;
}

export type SlotType = 'task' | 'break';

export interface ScheduleSlot {
  id: string;
  type: SlotType;
  projectId?: string;
  subtaskId?: string | null;
  label: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  dur: number;   // minutes
  done: boolean;
  missed: boolean;
  tag?: Tag;
}

export type Schedule = Record<string, ScheduleSlot[]>;

export interface Settings {
  start: string;
  end: string;
  maxBlocks: number;
  breakS: number;
  breakL: number;
  sound: boolean;
  confetti: boolean;
  autoReschedule: boolean;
  /** Reduce visual noise / motion for sensory-sensitive users. */
  calmMode: boolean;
}

export interface PomState {
  running: boolean;
  secs: number;
  total: number;
  rounds: number;
  isBreak: boolean;
  dur: number;
  /** Project the current focus session is attributed to. */
  projectId: string | null;
}

/* ── ADHD: Brain dump (quick capture inbox) ── */
export interface BrainDumpItem {
  id: string;
  text: string;
  createdAt: number;
}

/* ── Gamification ── */
export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlockedAt: number | null;
}

export interface Gamification {
  xp: number;
  level: number;
}

export interface Stats {
  projectsDone: number;
  subtasksDone: number;
  pomodoros: number;
  brainDumps: number;
  focusMins: number;
  breakdowns: number;
}

/* ── Auth (Supabase + Google) ── */
export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export type SyncStatus = 'idle' | 'connecting' | 'connected' | 'syncing' | 'error';

export interface SyncState {
  status: SyncStatus;
  message: string;
  lastSync: number | null;
}

/* ── Ephemeral toast (achievement / feedback) ── */
export interface Toast {
  id: string;
  title: string;
  desc: string;
  icon: string;
}
