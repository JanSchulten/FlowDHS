export interface Subtask {
  id: string;
  name: string;
  dur: number; // minutes
  done: boolean;
}

export type Priority = 'high' | 'med' | 'low';
export type Tag = 'focus' | 'creative' | 'energy' | 'admin';

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
}

export interface PomState {
  running: boolean;
  secs: number;
  total: number;
  rounds: number;
  isBreak: boolean;
  dur: number;
}
