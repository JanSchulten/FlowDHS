import type { Project, Schedule, Settings, Subtask, PomState } from '../types';
import { uid, todayKey } from '../engine/utils';
import { planDay, planWeek, checkMissed, autoReschedule } from '../engine/planner';

const SEED_PROJECTS: Project[] = [
  {
    id: 'seed1',
    name: 'Dissertation Kapitel 3',
    deadline: '2026-06-30',
    weekBudgetH: 6,
    estimateMins: 480,
    priority: 'high',
    tag: 'focus',
    done: false,
    subtasks: [
      { id: 's1', name: 'Literaturrecherche abschließen', dur: 45, done: false },
      { id: 's2', name: 'Gliederung erstellen', dur: 25, done: false },
      { id: 's3', name: 'Abschnitt 3.1 schreiben', dur: 45, done: false },
    ],
    createdAt: 0,
  },
  {
    id: 'seed2',
    name: 'Unity XR-Shader fertigstellen',
    deadline: '2026-06-20',
    weekBudgetH: 4,
    estimateMins: 180,
    priority: 'high',
    tag: 'creative',
    done: false,
    subtasks: [
      { id: 's4', name: 'Vertex-Shader debuggen', dur: 25, done: false },
      { id: 's5', name: 'Bloom-Effekt implementieren', dur: 45, done: false },
    ],
    createdAt: 0,
  },
  {
    id: 'seed3',
    name: 'n8n Podcast-Automation',
    deadline: null,
    weekBudgetH: 2,
    estimateMins: 120,
    priority: 'med',
    tag: 'admin',
    done: false,
    subtasks: [],
    createdAt: 0,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  start: '08:00',
  end: '19:00',
  maxBlocks: 4,
  breakS: 10,
  breakL: 30,
  sound: true,
  confetti: true,
  autoReschedule: true,
};

export interface AppState {
  projects: Project[];
  schedule: Schedule;
  settings: Settings;
  streak: number;
  theme: 'dark' | 'light';
  pom: PomState;
  activePage: string;
  projectFilter: 'all' | 'active' | 'urgent' | 'done';
  confettiTrigger: number;
}

export type Action =
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id' | 'createdAt'> }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'COMPLETE_PROJECT'; id: string }
  | { type: 'ADD_SUBTASK'; projectId: string; subtask: Omit<Subtask, 'id'> }
  | { type: 'TOGGLE_SUBTASK'; projectId: string; subtaskId: string }
  | { type: 'DELETE_SUBTASK'; projectId: string; subtaskId: string }
  | { type: 'TOGGLE_SLOT'; slotId: string }
  | { type: 'RESCHEDULE_SLOT'; slotId: string }
  | { type: 'PLAN_TODAY' }
  | { type: 'PLAN_WEEK' }
  | { type: 'AUTO_RESCHEDULE' }
  | { type: 'CHECK_MISSED' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_PAGE'; page: string }
  | { type: 'SET_FILTER'; filter: AppState['projectFilter'] }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'CLEAR_ALL' }
  | { type: 'POM_TICK' }
  | { type: 'POM_TOGGLE' }
  | { type: 'POM_RESET' }
  | { type: 'POM_SET_DUR'; dur: number }
  | { type: 'POM_FINISH_ROUND' };

function initialPom(dur = 25): PomState {
  return { running: false, secs: dur * 60, total: dur * 60, rounds: 0, isBreak: false, dur };
}

function loadFromStorage(): Partial<AppState> {
  try {
    const raw = localStorage.getItem('ff2_state');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function buildInitialState(): AppState {
  const saved = loadFromStorage();
  const isFirstRun = !saved.projects;

  return {
    projects: saved.projects ?? SEED_PROJECTS,
    schedule: saved.schedule ?? {},
    settings: { ...DEFAULT_SETTINGS, ...saved.settings },
    streak: saved.streak ?? 0,
    theme: saved.theme ?? 'dark',
    pom: initialPom(25),
    activePage: 'today',
    projectFilter: 'all',
    confettiTrigger: 0,
    ...(!isFirstRun ? {} : {}),
  };
}

export const INITIAL_STATE: AppState = buildInitialState();

function syncScheduleSlot(
  _projects: Project[],
  schedule: Schedule,
  slotId: string,
  done: boolean
): Schedule {
  const key = todayKey();
  const slots = (schedule[key] ?? []).map((s) => {
    if (s.id !== slotId) return s;
    const updated = { ...s, done, ...(done ? { missed: false } : {}) };
    return updated;
  });
  return { ...schedule, [key]: slots };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const project: Project = { ...action.payload, id: uid(), createdAt: Date.now() };
      const projects = [...state.projects, project];
      const schedule = {
        ...state.schedule,
        [todayKey()]: planDay(todayKey(), projects, state.settings),
      };
      return { ...state, projects, schedule };
    }

    case 'UPDATE_PROJECT': {
      const projects = state.projects.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
      const schedule = {
        ...state.schedule,
        [todayKey()]: planDay(todayKey(), projects, state.settings),
      };
      return { ...state, projects, schedule };
    }

    case 'DELETE_PROJECT': {
      const projects = state.projects.filter((p) => p.id !== action.id);
      const schedule = {
        ...state.schedule,
        [todayKey()]: planDay(todayKey(), projects, state.settings),
      };
      return { ...state, projects, schedule };
    }

    case 'COMPLETE_PROJECT': {
      const projects = state.projects.map((p) =>
        p.id === action.id ? { ...p, done: !p.done } : p
      );
      const wasCompleted = projects.find((p) => p.id === action.id)?.done;
      const streak = wasCompleted ? state.streak + 1 : state.streak;
      const confettiTrigger = wasCompleted ? state.confettiTrigger + 1 : state.confettiTrigger;
      return { ...state, projects, streak, confettiTrigger };
    }

    case 'ADD_SUBTASK': {
      const subtask: Subtask = { ...action.subtask, id: uid() };
      const projects = state.projects.map((p) =>
        p.id === action.projectId
          ? { ...p, subtasks: [...p.subtasks, subtask] }
          : p
      );
      const schedule = {
        ...state.schedule,
        [todayKey()]: planDay(todayKey(), projects, state.settings),
      };
      return { ...state, projects, schedule };
    }

    case 'TOGGLE_SUBTASK': {
      let confettiTrigger = state.confettiTrigger;
      let streak = state.streak;
      const projects = state.projects.map((p) => {
        if (p.id !== action.projectId) return p;
        const subtasks = p.subtasks.map((s) =>
          s.id === action.subtaskId ? { ...s, done: !s.done } : s
        );
        const allDone = subtasks.length > 0 && subtasks.every((s) => s.done);
        if (allDone && !p.done) { streak++; confettiTrigger++; }
        return { ...p, subtasks, done: allDone ? true : p.done };
      });

      // Sync schedule slot
      const key = todayKey();
      const slots = (state.schedule[key] ?? []).map((s) => {
        if (s.subtaskId !== action.subtaskId) return s;
        const st = projects
          .find((p) => p.id === action.projectId)
          ?.subtasks.find((x) => x.id === action.subtaskId);
        return { ...s, done: st?.done ?? s.done };
      });

      return {
        ...state,
        projects,
        streak,
        confettiTrigger,
        schedule: { ...state.schedule, [key]: slots },
      };
    }

    case 'DELETE_SUBTASK': {
      const projects = state.projects.map((p) =>
        p.id === action.projectId
          ? { ...p, subtasks: p.subtasks.filter((s) => s.id !== action.subtaskId) }
          : p
      );
      return { ...state, projects };
    }

    case 'TOGGLE_SLOT': {
      const key = todayKey();
      const slot = (state.schedule[key] ?? []).find((s) => s.id === action.slotId);
      if (!slot) return state;
      const done = !slot.done;
      const schedule = syncScheduleSlot(state.projects, state.schedule, action.slotId, done);

      // Sync subtask
      let projects = state.projects;
      if (slot.subtaskId) {
        projects = state.projects.map((p) => {
          if (p.id !== slot.projectId) return p;
          return {
            ...p,
            subtasks: p.subtasks.map((s) =>
              s.id === slot.subtaskId ? { ...s, done } : s
            ),
          };
        });
      }

      const confettiTrigger = done ? state.confettiTrigger + 1 : state.confettiTrigger;
      const streak = done ? state.streak + 1 : state.streak;
      return { ...state, schedule, projects, confettiTrigger, streak };
    }

    case 'RESCHEDULE_SLOT': {
      const key = todayKey();
      const slot = (state.schedule[key] ?? []).find((s) => s.id === action.slotId);
      if (!slot) return state;

      const todaySlots = (state.schedule[key] ?? []).map((s) =>
        s.id === action.slotId ? { ...s, missed: false, done: false } : s
      );
      let schedule: Schedule = { ...state.schedule, [key]: todaySlots };

      const now = new Date();
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        const dk = d.toISOString().slice(0, 10);
        const existing = (schedule[dk] ?? []).filter((s) => s.type === 'task');
        if (existing.length < state.settings.maxBlocks) {
          schedule = {
            ...schedule,
            [dk]: [...(schedule[dk] ?? []), { ...slot, id: uid(), missed: false, done: false }],
          };
          break;
        }
      }

      return { ...state, schedule };
    }

    case 'PLAN_TODAY': {
      const schedule = {
        ...state.schedule,
        [todayKey()]: planDay(todayKey(), state.projects, state.settings),
      };
      return { ...state, schedule };
    }

    case 'PLAN_WEEK': {
      const schedule = planWeek(state.projects, state.settings, state.schedule);
      return { ...state, schedule };
    }

    case 'AUTO_RESCHEDULE': {
      const schedule = autoReschedule(state.schedule, state.projects, state.settings);
      const confettiTrigger = state.confettiTrigger + 1;
      return { ...state, schedule, confettiTrigger };
    }

    case 'CHECK_MISSED': {
      const schedule = checkMissed(state.schedule);
      return { ...state, schedule };
    }

    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.payload };
      return { ...state, settings };
    }

    case 'SET_PAGE':
      return { ...state, activePage: action.page };

    case 'SET_FILTER':
      return { ...state, projectFilter: action.filter };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'CLEAR_ALL':
      return {
        ...state,
        projects: [],
        schedule: {},
        streak: 0,
        pom: initialPom(25),
        confettiTrigger: 0,
      };

    case 'POM_TOGGLE':
      return { ...state, pom: { ...state.pom, running: !state.pom.running } };

    case 'POM_TICK': {
      if (!state.pom.running) return state;
      if (state.pom.secs <= 0) return state;
      return { ...state, pom: { ...state.pom, secs: state.pom.secs - 1 } };
    }

    case 'POM_FINISH_ROUND': {
      const wasBreak = state.pom.isBreak;
      if (!wasBreak) {
        const pom: PomState = {
          ...state.pom,
          running: false,
          rounds: state.pom.rounds + 1,
          isBreak: true,
          secs: 5 * 60,
          total: 5 * 60,
        };
        return {
          ...state,
          pom,
          streak: state.streak + 1,
          confettiTrigger: state.confettiTrigger + 1,
        };
      } else {
        const pom: PomState = {
          ...state.pom,
          running: false,
          isBreak: false,
          secs: state.pom.dur * 60,
          total: state.pom.dur * 60,
        };
        return { ...state, pom };
      }
    }

    case 'POM_RESET': {
      const pom: PomState = {
        ...state.pom,
        running: false,
        isBreak: false,
        secs: state.pom.dur * 60,
        total: state.pom.dur * 60,
      };
      return { ...state, pom };
    }

    case 'POM_SET_DUR': {
      const pom: PomState = {
        ...state.pom,
        dur: action.dur,
        running: false,
        isBreak: false,
        secs: action.dur * 60,
        total: action.dur * 60,
      };
      return { ...state, pom };
    }

    default:
      return state;
  }
}
