import { useEffect, useMemo, useRef } from 'react';
import {
  CalendarCheck, CalendarRange, KanbanSquare, Layers, Brain, Timer, Settings as SettingsIcon,
  Plus, RefreshCw, Moon, Sun, CloudUpload,
} from 'lucide-react';
import { useStore } from './store/useStore';
import { TopBar } from './components/layout/TopBar';
import { SideBar } from './components/layout/SideBar';
import { Today } from './components/pages/Today';
import { Week } from './components/pages/Week';
import { Projects } from './components/pages/Projects';
import { Board } from './components/board/Board';
import { Inbox } from './components/pages/Inbox';
import { Focus } from './components/pages/Focus';
import { Settings } from './components/pages/Settings';
import { useConfetti } from './components/ui/Confetti';
import { CommandPalette } from './components/ui/CommandPalette';
import type { Command } from './components/ui/CommandPalette';
import { AchievementToast } from './components/ui/AchievementToast';
import { Onboarding } from './components/ui/Onboarding';
import { pushProjects, parseSheetId } from './engine/sheets';

export default function App() {
  const { state, dispatch } = useStore();

  useConfetti(state.confettiTrigger, state.settings.confetti);

  const navigate = (page: string) => dispatch({ type: 'SET_PAGE', page });

  // Reflect calm mode on the root element so CSS can dial down motion/visuals.
  useEffect(() => {
    document.documentElement.setAttribute('data-calm', String(state.settings.calmMode));
  }, [state.settings.calmMode]);

  // Global ⌘K / Ctrl+K to toggle the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_COMMAND' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  // Optional auto-push to Google Sheets (debounced) when enabled & configured.
  const pushTimer = useRef<number | null>(null);
  const { google } = state;
  const projectsSig = useMemo(() => JSON.stringify(state.projects), [state.projects]);
  useEffect(() => {
    if (!google.autoPush || !google.clientId || !parseSheetId(google.sheetUrl)) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(async () => {
      dispatch({ type: 'SET_SYNC', payload: { status: 'syncing', message: 'Auto-Sync…' } });
      try {
        await pushProjects(google.clientId, google.sheetUrl, state.projects);
        dispatch({ type: 'SET_SYNC', payload: { status: 'connected', message: 'Auto-synchronisiert', lastSync: Date.now() } });
      } catch (e) {
        dispatch({ type: 'SET_SYNC', payload: { status: 'error', message: (e as Error).message } });
      }
    }, 2500);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectsSig, google.autoPush, google.clientId, google.sheetUrl]);

  const commands: Command[] = useMemo(() => {
    const close = () => dispatch({ type: 'TOGGLE_COMMAND', open: false });
    const go = (page: string) => { navigate(page); close(); };
    return [
      { id: 'today', label: 'Gehe zu: Tagesplan', icon: CalendarCheck, run: () => go('today') },
      { id: 'week', label: 'Gehe zu: Wochenplan', icon: CalendarRange, run: () => go('week') },
      { id: 'board', label: 'Gehe zu: Board', icon: KanbanSquare, run: () => go('board') },
      { id: 'projects', label: 'Gehe zu: Projekte', icon: Layers, run: () => go('projects') },
      { id: 'inbox', label: 'Gehe zu: Brain-Dump', icon: Brain, run: () => go('inbox') },
      { id: 'focus', label: 'Gehe zu: Fokus-Timer', icon: Timer, run: () => go('focus') },
      { id: 'settings', label: 'Gehe zu: Einstellungen', icon: SettingsIcon, run: () => go('settings') },
      { id: 'new', label: 'Neues Projekt anlegen', hint: 'Projekte', icon: Plus, run: () => go('projects') },
      { id: 'plan', label: 'Woche neu planen', icon: RefreshCw, run: () => { dispatch({ type: 'PLAN_WEEK' }); close(); } },
      { id: 'theme', label: 'Theme wechseln', icon: state.theme === 'dark' ? Sun : Moon, run: () => { dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' }); close(); } },
      {
        id: 'push', label: 'Jetzt in Google Sheet hochladen', icon: CloudUpload,
        run: async () => {
          close();
          if (!google.clientId || !parseSheetId(google.sheetUrl)) { navigate('settings'); return; }
          dispatch({ type: 'SET_SYNC', payload: { status: 'syncing', message: 'Lade hoch…' } });
          try {
            await pushProjects(google.clientId, google.sheetUrl, state.projects);
            dispatch({ type: 'SET_SYNC', payload: { status: 'connected', message: 'Hochgeladen', lastSync: Date.now() } });
          } catch (e) {
            dispatch({ type: 'SET_SYNC', payload: { status: 'error', message: (e as Error).message } });
          }
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.theme, google.clientId, google.sheetUrl, state.projects]);

  const openProjects = state.projects.filter((p) => !p.done).length;

  const renderPage = () => {
    switch (state.activePage) {
      case 'today': return <Today state={state} dispatch={dispatch} />;
      case 'week': return <Week state={state} dispatch={dispatch} />;
      case 'board': return <Board state={state} dispatch={dispatch} />;
      case 'projects': return <Projects state={state} dispatch={dispatch} />;
      case 'inbox': return <Inbox state={state} dispatch={dispatch} />;
      case 'focus': return <Focus state={state} dispatch={dispatch} />;
      case 'settings': return <Settings state={state} dispatch={dispatch} />;
      default: return <Today state={state} dispatch={dispatch} />;
    }
  };

  return (
    <div className="shell">
      <TopBar
        theme={state.theme}
        xp={state.game.xp}
        streak={state.streak}
        sync={state.sync}
        onToggleTheme={() => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })}
        onOpenCommand={() => dispatch({ type: 'TOGGLE_COMMAND', open: true })}
        onOpenSettings={() => navigate('settings')}
      />
      <SideBar
        activePage={state.activePage}
        openCount={openProjects}
        dumpCount={state.brainDump.length}
        calmMode={state.settings.calmMode}
        onNavigate={navigate}
        onToggleCalm={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { calmMode: v } })}
      />
      <main className="content">{renderPage()}</main>

      <CommandPalette
        open={state.commandOpen}
        commands={commands}
        onClose={() => dispatch({ type: 'TOGGLE_COMMAND', open: false })}
      />
      <AchievementToast toast={state.toast} onDismiss={() => dispatch({ type: 'DISMISS_TOAST' })} />
      <Onboarding open={!state.onboardingDone} onFinish={() => dispatch({ type: 'COMPLETE_ONBOARDING' })} />
    </div>
  );
}
