export interface Subtask {
  id: string;
  name: string;
  dur: number; // minutes
  done: boolean;
}

export type Priority = 'high' | 'med' | 'low';
export type BuiltinTag = 'focus' | 'creative' | 'energy' | 'admin';
export type Tag = string; // built-in or custom category id

export type WorkContext = 'work' | 'private';

/** Kanban / board column the project currently lives in. */
export type BoardStatus = 'backlog' | 'today' | 'doing' | 'done';

export interface CustomCategory {
  id: string;
  name: string;
  /** Foreground hex color, e.g. '#a78bfa' */
  color: string;
  /** Background hex color for the chip */
  bgColor: string;
}

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
  /** If set, this project is only scheduled inside the matching container Fixture. */
  fixtureId?: string;
  /** Work or private context — private tasks can fill work slots, work tasks cannot fill private slots. */
  workContext: WorkContext;
}

/* ── Fixed, time-bound appointments (e.g. work) ── */
export type FixtureKind =
  | 'block'      // locked: nothing else can be scheduled in this window
  | 'container'  // open: assigned tasks/projects are scheduled only inside it
  | 'parallel';  // tasks can run alongside at reduced capacity

export interface Fixture {
  id: string;
  name: string;
  kind: FixtureKind;
  start: string;          // 'HH:MM'
  end: string;            // 'HH:MM'
  /** Weekday indices it recurs on (0=So … 6=Sa). Empty => one-off on `date`. */
  days: number[];
  /** Specific date 'YYYY-MM-DD' for a one-off appointment (when `days` empty). */
  date: string | null;
  tag?: Tag;
  /** Work context of this time slot — governs which projects can fill it. */
  workContext?: WorkContext;
  /**
   * For kind='parallel': percentage of capacity available for parallel tasks (0–100).
   * 100 = full parallel work, 50 = half capacity alongside the appointment.
   */
  parallelCapacity?: number;
}

export type SlotType = 'task' | 'break' | 'fixed';

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
  /** For type 'fixed': which kind of appointment it represents. */
  fixtureKind?: FixtureKind;
  /** True for locked block appointments (nothing schedulable inside). */
  locked?: boolean;
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
  /** User-defined custom categories (appear alongside built-in tags). */
  customCategories: CustomCategory[];
  /** Whether browser notification permission has been requested. */
  notifications: boolean;
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
