import type {
  Project, Schedule, Settings, Subtask, PomState, BrainDumpItem,
  Gamification, Achievement, Stats, SyncState, Toast, BoardStatus,
  AppUser, Fixture,
} from '../types';
import { uid, todayKey } from '../engine/utils';
import { planDay, planWeek, checkMissed, autoReschedule } from '../engine/planner';
import {
  XP, levelFromXp, ACHIEVEMENT_CATALOG, evaluateAchievements, levelTitle,
} from '../engine/gamification';

const SEED_PROJECTS: Project[] = [
  {
    id: 'seed1', name: 'Dissertation Kapitel 3', deadline: '2026-06-30',
    weekBudgetH: 6, estimateMins: 480, priority: 'high', tag: 'focus', done: false,
    status: 'today', actualMins: 0, createdAt: 0,
    subtasks: [
      { id: 's1', name: 'Literaturrecherche abschließen', dur: 45, done: false },
      { id: 's2', name: 'Gliederung erstellen', dur: 25, done: false },
      { id: 's3', name: 'Abschnitt 3.1 schreiben', dur: 45, done: false },
    ],
  },
  {
    id: 'seed2', name: 'Unity XR-Shader fertigstellen', deadline: '2026-06-20',
    weekBudgetH: 4, estimateMins: 180, priority: 'high', tag: 'creative', done: false,
    status: 'doing', actualMins: 0, createdAt: 0,
    subtasks: [
      { id: 's4', name: 'Vertex-Shader debuggen', dur: 25, done: false },
      { id: 's5', name: 'Bloom-Effekt implementieren', dur: 45, done: false },
    ],
  },
  {
    id: 'seed3', name: 'n8n Podcast-Automation', deadline: null,
    weekBudgetH: 2, estimateMins: 120, priority: 'med', tag: 'admin', done: false,
    status: 'backlog', actualMins: 0, createdAt: 0, subtasks: [],
  },
];

const SEED_FIXTURES: Fixture[] = [
  {
    id: 'fix-work', name: '💼 Arbeit', kind: 'block',
    start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5], date: null, tag: 'admin',
  },
];

export const DEFAULT_SETTINGS: Settings = {
  start: '08:00', end: '19:00', maxBlocks: 4, breakS: 10, breakL: 30,
  sound: true, confetti: true, autoReschedule: true, calmMode: false,
};

const DEFAULT_STATS: Stats = {
  projectsDone: 0, subtasksDone: 0, pomodoros: 0, brainDumps: 0, focusMins: 0, breakdowns: 0,
};

const DEFAULT_SYNC: SyncState = { status: 'idle', message: '', lastSync: null };

function catalogToAchievements(): Achievement[] {
  return ACHIEVEMENT_CATALOG.map((a) => ({ ...a, unlockedAt: null }));
}

export interface AppState {
  projects: Project[];
  fixtures: Fixture[];
  schedule: Schedule;
  settings: Settings;
  streak: number;
  theme: 'dark' | 'light';
  pom: PomState;
  activePage: string;
  projectFilter: 'all' | 'active' | 'urgent' | 'done';
  confettiTrigger: number;
  brainDump: BrainDumpItem[];
  game: Gamification;
  achievements: Achievement[];
  stats: Stats;
  sync: SyncState;
  user: AppUser | null;
  /** True once the cloud snapshot has been pulled (gates auto-push). */
  cloudLoaded: boolean;
  toast: Toast | null;
  commandOpen: boolean;
  onboardingDone: boolean;
}

/** Persisted slice of the app — mirrored to localStorage and Supabase. */
export interface Snapshot {
  projects: Project[];
  fixtures: Fixture[];
  schedule: Schedule;
  settings: Settings;
  streak: number;
  theme: 'dark' | 'light';
  brainDump: BrainDumpItem[];
  game: Gamification;
  achievements: Achievement[];
  stats: Stats;
  onboardingDone: boolean;
}

export function toSnapshot(state: AppState): Snapshot {
  return {
    projects: state.projects,
    fixtures: state.fixtures,
    schedule: state.schedule,
    settings: state.settings,
    streak: state.streak,
    theme: state.theme,
    brainDump: state.brainDump,
    game: state.game,
    achievements: state.achievements,
    stats: state.stats,
    onboardingDone: state.onboardingDone,
  };
}

export type Action =
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id' | 'createdAt'> }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'COMPLETE_PROJECT'; id: string }
  | { type: 'SET_PROJECT_STATUS'; id: string; status: BoardStatus }
  | { type: 'ADD_SUBTASK'; projectId: string; subtask: Omit<Subtask, 'id'> }
  | { type: 'ADD_SUBTASKS_BULK'; projectId: string; subtasks: Omit<Subtask, 'id'>[] }
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
  | { type: 'POM_SET_PROJECT'; projectId: string | null }
  | { type: 'POM_FINISH_ROUND' }
  | { type: 'ADD_BRAINDUMP'; text: string }
  | { type: 'DELETE_BRAINDUMP'; id: string }
  | { type: 'CONVERT_BRAINDUMP'; id: string }
  | { type: 'ADD_FIXTURE'; payload: Omit<Fixture, 'id'> }
  | { type: 'UPDATE_FIXTURE'; payload: Fixture }
  | { type: 'DELETE_FIXTURE'; id: string }
  | { type: 'SET_SYNC'; payload: Partial<SyncState> }
  | { type: 'SET_USER'; user: AppUser | null }
  | { type: 'HYDRATE'; snapshot: Partial<Snapshot> }
  | { type: 'REPLACE_PROJECTS'; projects: Project[] }
  | { type: 'DISMISS_TOAST' }
  | { type: 'TOGGLE_COMMAND'; open?: boolean }
  | { type: 'COMPLETE_ONBOARDING' };

function initialPom(dur = 25): PomState {
  return { running: false, secs: dur * 60, total: dur * 60, rounds: 0, isBreak: false, dur, projectId: null };
}

function migrateProject(p: Partial<Project>): Project {
  return {
    id: p.id ?? uid(),
    name: p.name ?? '',
    deadline: p.deadline ?? null,
    weekBudgetH: p.weekBudgetH ?? 2,
    estimateMins: p.estimateMins ?? 60,
    priority: p.priority ?? 'med',
    tag: p.tag ?? 'focus',
    done: p.done ?? false,
    subtasks: p.subtasks ?? [],
    createdAt: p.createdAt ?? Date.now(),
    status: p.status ?? (p.done ? 'done' : 'backlog'),
    actualMins: p.actualMins ?? 0,
    note: p.note,
    fixtureId: p.fixtureId,
  };
}

function loadFromStorage(): Partial<AppState> {
  try {
    const raw = localStorage.getItem('ff2_state');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

// Merge the achievement catalog with any saved unlock timestamps.
function mergeAchievements(saved: Achievement[] | undefined): Achievement[] {
  const savedAch = new Map((saved ?? []).map((a) => [a.id, a.unlockedAt]));
  return catalogToAchievements().map((a) => ({ ...a, unlockedAt: savedAch.get(a.id) ?? null }));
}

function buildInitialState(): AppState {
  const saved = loadFromStorage();
  const rawProjects = saved.projects ?? SEED_PROJECTS;

  return {
    projects: rawProjects.map(migrateProject),
    fixtures: saved.fixtures ?? SEED_FIXTURES,
    schedule: saved.schedule ?? {},
    settings: { ...DEFAULT_SETTINGS, ...saved.settings },
    streak: saved.streak ?? 0,
    theme: saved.theme ?? 'dark',
    pom: initialPom(25),
    activePage: 'today',
    projectFilter: 'all',
    confettiTrigger: 0,
    brainDump: saved.brainDump ?? [],
    game: saved.game ?? { xp: 0, level: 1 },
    achievements: mergeAchievements(saved.achievements),
    stats: { ...DEFAULT_STATS, ...saved.stats },
    sync: DEFAULT_SYNC,
    user: null,
    cloudLoaded: false,
    toast: null,
    commandOpen: false,
    onboardingDone: saved.onboardingDone ?? false,
  };
}

export const INITIAL_STATE: AppState = buildInitialState();

/* ── Progress helper: XP + level-ups + achievement unlocks + toast + confetti ── */
interface ProgressResult {
  game: Gamification;
  stats: Stats;
  achievements: Achievement[];
  toast: Toast | null;
  confettiTrigger: number;
}

function applyProgress(
  state: AppState,
  xpGain: number,
  statPatch: Partial<Stats>,
  streakOverride?: number
): ProgressResult {
  const stats: Stats = { ...state.stats };
  for (const k of Object.keys(statPatch) as (keyof Stats)[]) {
    stats[k] = (stats[k] ?? 0) + (statPatch[k] ?? 0);
  }

  const xp = state.game.xp + xpGain;
  const { level } = levelFromXp(xp);
  const leveledUp = level > state.game.level;
  const game: Gamification = { xp, level };

  const streak = streakOverride ?? state.streak;
  const shouldBe = evaluateAchievements(stats, level, streak, stats.breakdowns > 0);
  const achievements = state.achievements.map((a) =>
    a.unlockedAt == null && shouldBe.includes(a.id)
      ? { ...a, unlockedAt: Date.now() }
      : a
  );

  const newlyUnlocked = achievements.find(
    (a, i) => a.unlockedAt != null && state.achievements[i].unlockedAt == null
  );

  let toast: Toast | null = state.toast;
  let confettiTrigger = state.confettiTrigger;

  if (newlyUnlocked) {
    toast = { id: uid(), title: newlyUnlocked.name, desc: newlyUnlocked.desc, icon: newlyUnlocked.icon };
    confettiTrigger++;
  } else if (leveledUp) {
    toast = { id: uid(), title: `Level ${level} – ${levelTitle(level)}`, desc: 'Du steigst auf! 🎉', icon: '🌟' };
    confettiTrigger++;
  }

  return { game, stats, achievements, toast, confettiTrigger };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const project = migrateProject({ ...action.payload, id: uid(), createdAt: Date.now() });
      const projects = [...state.projects, project];
      return { ...state, projects, schedule: replanToday(state, projects) };
    }

    case 'UPDATE_PROJECT': {
      const projects = state.projects.map((p) => (p.id === action.payload.id ? action.payload : p));
      return { ...state, projects, schedule: replanToday(state, projects) };
    }

    case 'DELETE_PROJECT': {
      const projects = state.projects.filter((p) => p.id !== action.id);
      return { ...state, projects, schedule: replanToday(state, projects) };
    }

    case 'SET_PROJECT_STATUS': {
      const projects = state.projects.map((p) => {
        if (p.id !== action.id) return p;
        return { ...p, status: action.status, done: action.status === 'done' };
      });
      const moved = projects.find((p) => p.id === action.id);
      // Completing via board column awards project XP.
      if (action.status === 'done' && moved && !state.projects.find((x) => x.id === action.id)?.done) {
        const prog = applyProgress(state, XP.project, { projectsDone: 1 }, state.streak + 1);
        return { ...state, projects, streak: state.streak + 1, ...prog, schedule: replanToday(state, projects) };
      }
      return { ...state, projects, schedule: replanToday(state, projects) };
    }

    case 'ADD_SUBTASK': {
      const subtask: Subtask = { ...action.subtask, id: uid() };
      const projects = state.projects.map((p) =>
        p.id === action.projectId ? { ...p, subtasks: [...p.subtasks, subtask] } : p
      );
      return { ...state, projects, schedule: replanToday(state, projects) };
    }

    case 'ADD_SUBTASKS_BULK': {
      const additions: Subtask[] = action.subtasks.map((s) => ({ ...s, id: uid() }));
      const projects = state.projects.map((p) =>
        p.id === action.projectId ? { ...p, subtasks: [...p.subtasks, ...additions] } : p
      );
      const prog = applyProgress(state, XP.breakdown, { breakdowns: 1 });
      return { ...state, projects, ...prog, schedule: replanToday(state, projects) };
    }

    case 'TOGGLE_SUBTASK': {
      const prev = state.projects.find((p) => p.id === action.projectId)
        ?.subtasks.find((s) => s.id === action.subtaskId);
      const willBeDone = prev ? !prev.done : false;

      let projectCompleted = false;
      const projects = state.projects.map((p) => {
        if (p.id !== action.projectId) return p;
        const subtasks = p.subtasks.map((s) =>
          s.id === action.subtaskId ? { ...s, done: !s.done } : s
        );
        const allDone = subtasks.length > 0 && subtasks.every((s) => s.done);
        if (allDone && !p.done) projectCompleted = true;
        return {
          ...p, subtasks,
          done: allDone ? true : p.done,
          status: allDone ? ('done' as BoardStatus) : p.status,
        };
      });

      const key = todayKey();
      const slots = (state.schedule[key] ?? []).map((s) =>
        s.subtaskId === action.subtaskId ? { ...s, done: willBeDone } : s
      );

      if (willBeDone) {
        const xpGain = XP.subtask + (projectCompleted ? XP.project : 0);
        const statPatch: Partial<Stats> = {
          subtasksDone: 1, ...(projectCompleted ? { projectsDone: 1 } : {}),
        };
        const newStreak = state.streak + 1;
        const prog = applyProgress(state, xpGain, statPatch, newStreak);
        return { ...state, projects, streak: newStreak, ...prog, schedule: { ...state.schedule, [key]: slots } };
      }

      return { ...state, projects, schedule: { ...state.schedule, [key]: slots } };
    }

    case 'DELETE_SUBTASK': {
      const projects = state.projects.map((p) =>
        p.id === action.projectId
          ? { ...p, subtasks: p.subtasks.filter((s) => s.id !== action.subtaskId) }
          : p
      );
      return { ...state, projects };
    }

    case 'COMPLETE_PROJECT': {
      const target = state.projects.find((p) => p.id === action.id);
      const willBeDone = target ? !target.done : false;
      const projects = state.projects.map((p) =>
        p.id === action.id
          ? { ...p, done: willBeDone, status: willBeDone ? ('done' as BoardStatus) : ('today' as BoardStatus) }
          : p
      );
      if (willBeDone) {
        const newStreak = state.streak + 1;
        const prog = applyProgress(state, XP.project, { projectsDone: 1 }, newStreak);
        return { ...state, projects, streak: newStreak, ...prog };
      }
      return { ...state, projects };
    }

    case 'TOGGLE_SLOT': {
      const key = todayKey();
      const slot = (state.schedule[key] ?? []).find((s) => s.id === action.slotId);
      if (!slot) return state;
      const done = !slot.done;
      const slots = (state.schedule[key] ?? []).map((s) =>
        s.id === action.slotId ? { ...s, done, ...(done ? { missed: false } : {}) } : s
      );

      let projects = state.projects;
      if (slot.subtaskId) {
        projects = state.projects.map((p) =>
          p.id !== slot.projectId ? p : {
            ...p, subtasks: p.subtasks.map((s) => (s.id === slot.subtaskId ? { ...s, done } : s)),
          }
        );
      }

      if (done) {
        const newStreak = state.streak + 1;
        const prog = applyProgress(state, XP.subtask, { subtasksDone: 1, focusMins: slot.dur }, newStreak);
        return { ...state, projects, streak: newStreak, ...prog, schedule: { ...state.schedule, [key]: slots } };
      }
      return { ...state, projects, schedule: { ...state.schedule, [key]: slots } };
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
        const d = new Date(now); d.setDate(d.getDate() + i);
        const dk = d.toISOString().slice(0, 10);
        const existing = (schedule[dk] ?? []).filter((s) => s.type === 'task');
        if (existing.length < state.settings.maxBlocks) {
          schedule = { ...schedule, [dk]: [...(schedule[dk] ?? []), { ...slot, id: uid(), missed: false, done: false }] };
          break;
        }
      }
      return { ...state, schedule };
    }

    case 'PLAN_TODAY':
      return { ...state, schedule: replanToday(state, state.projects) };

    case 'PLAN_WEEK': {
      const schedule = planWeek(state.projects, state.settings, state.schedule, state.fixtures);
      const prog = applyProgress(state, XP.plan, {});
      return { ...state, schedule, ...prog };
    }

    case 'AUTO_RESCHEDULE': {
      const schedule = autoReschedule(state.schedule, state.projects, state.settings, state.fixtures);
      return { ...state, schedule, confettiTrigger: state.confettiTrigger + 1 };
    }

    case 'ADD_FIXTURE': {
      const fixture: Fixture = { ...action.payload, id: uid() };
      const fixtures = [...state.fixtures, fixture];
      return { ...state, fixtures, schedule: replanToday(state, state.projects, fixtures) };
    }

    case 'UPDATE_FIXTURE': {
      const fixtures = state.fixtures.map((f) => (f.id === action.payload.id ? action.payload : f));
      return { ...state, fixtures, schedule: replanToday(state, state.projects, fixtures) };
    }

    case 'DELETE_FIXTURE': {
      const fixtures = state.fixtures.filter((f) => f.id !== action.id);
      // Free any projects that were bound to this container.
      const projects = state.projects.map((p) => (p.fixtureId === action.id ? { ...p, fixtureId: undefined } : p));
      return { ...state, fixtures, projects, schedule: replanToday({ ...state, fixtures }, projects, fixtures) };
    }

    case 'CHECK_MISSED':
      return { ...state, schedule: checkMissed(state.schedule) };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_PAGE':
      return { ...state, activePage: action.page, commandOpen: false };

    case 'SET_FILTER':
      return { ...state, projectFilter: action.filter };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'CLEAR_ALL':
      return {
        ...state, projects: [], fixtures: [], schedule: {}, streak: 0, pom: initialPom(25),
        confettiTrigger: 0, brainDump: [], game: { xp: 0, level: 1 },
        achievements: catalogToAchievements(), stats: { ...DEFAULT_STATS }, toast: null,
      };

    case 'POM_TOGGLE':
      return { ...state, pom: { ...state.pom, running: !state.pom.running } };

    case 'POM_TICK':
      if (!state.pom.running || state.pom.secs <= 0) return state;
      return { ...state, pom: { ...state.pom, secs: state.pom.secs - 1 } };

    case 'POM_FINISH_ROUND': {
      if (!state.pom.isBreak) {
        const pom: PomState = {
          ...state.pom, running: false, rounds: state.pom.rounds + 1,
          isBreak: true, secs: 5 * 60, total: 5 * 60,
        };
        // Attribute focused minutes to the chosen project (time-blindness aid).
        const projects = state.pom.projectId
          ? state.projects.map((p) =>
              p.id === state.pom.projectId ? { ...p, actualMins: p.actualMins + state.pom.dur } : p
            )
          : state.projects;
        const newStreak = state.streak + 1;
        const prog = applyProgress(state, XP.pomodoro, { pomodoros: 1, focusMins: state.pom.dur }, newStreak);
        return { ...state, pom, projects, streak: newStreak, ...prog };
      }
      const pom: PomState = {
        ...state.pom, running: false, isBreak: false,
        secs: state.pom.dur * 60, total: state.pom.dur * 60,
      };
      return { ...state, pom };
    }

    case 'POM_RESET':
      return {
        ...state,
        pom: { ...state.pom, running: false, isBreak: false, secs: state.pom.dur * 60, total: state.pom.dur * 60 },
      };

    case 'POM_SET_DUR':
      return {
        ...state,
        pom: { ...state.pom, dur: action.dur, running: false, isBreak: false, secs: action.dur * 60, total: action.dur * 60 },
      };

    case 'POM_SET_PROJECT':
      return { ...state, pom: { ...state.pom, projectId: action.projectId } };

    case 'ADD_BRAINDUMP': {
      const text = action.text.trim();
      if (!text) return state;
      const item: BrainDumpItem = { id: uid(), text, createdAt: Date.now() };
      const prog = applyProgress(state, XP.brainDump, { brainDumps: 1 });
      return { ...state, brainDump: [item, ...state.brainDump], ...prog };
    }

    case 'DELETE_BRAINDUMP':
      return { ...state, brainDump: state.brainDump.filter((b) => b.id !== action.id) };

    case 'CONVERT_BRAINDUMP': {
      const item = state.brainDump.find((b) => b.id === action.id);
      if (!item) return state;
      const project = migrateProject({
        id: uid(), name: item.text, priority: 'med', tag: 'focus',
        weekBudgetH: 2, estimateMins: 60, status: 'backlog', createdAt: Date.now(),
      });
      const projects = [...state.projects, project];
      return {
        ...state, projects,
        brainDump: state.brainDump.filter((b) => b.id !== action.id),
        schedule: replanToday(state, projects),
      };
    }

    case 'SET_SYNC':
      return { ...state, sync: { ...state.sync, ...action.payload } };

    case 'SET_USER':
      return { ...state, user: action.user, cloudLoaded: action.user ? state.cloudLoaded : false };

    case 'HYDRATE': {
      const s = action.snapshot;
      const projects = s.projects ? s.projects.map(migrateProject) : state.projects;
      return {
        ...state,
        projects,
        fixtures: s.fixtures ?? state.fixtures,
        schedule: s.schedule ?? state.schedule,
        settings: { ...state.settings, ...s.settings },
        streak: s.streak ?? state.streak,
        theme: s.theme ?? state.theme,
        brainDump: s.brainDump ?? state.brainDump,
        game: s.game ?? state.game,
        achievements: s.achievements ? mergeAchievements(s.achievements) : state.achievements,
        stats: { ...state.stats, ...s.stats },
        onboardingDone: s.onboardingDone ?? state.onboardingDone,
        cloudLoaded: true,
      };
    }

    case 'REPLACE_PROJECTS': {
      const projects = action.projects.map(migrateProject);
      return { ...state, projects, schedule: replanToday(state, projects) };
    }

    case 'DISMISS_TOAST':
      return { ...state, toast: null };

    case 'TOGGLE_COMMAND':
      return { ...state, commandOpen: action.open ?? !state.commandOpen };

    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingDone: true };

    default:
      return state;
  }
}

function replanToday(state: AppState, projects: Project[], fixtures?: Fixture[]): Schedule {
  return { ...state.schedule, [todayKey()]: planDay(todayKey(), projects, state.settings, fixtures ?? state.fixtures) };
}
