import { useStore } from './store/useStore';
import { TopBar } from './components/layout/TopBar';
import { SideBar } from './components/layout/SideBar';
import { Today } from './components/pages/Today';
import { Week } from './components/pages/Week';
import { Projects } from './components/pages/Projects';
import { Focus } from './components/pages/Focus';
import { Settings } from './components/pages/Settings';
import { useConfetti } from './components/ui/Confetti';

export default function App() {
  const { state, dispatch } = useStore();

  useConfetti(state.confettiTrigger, state.settings.confetti);

  const navigate = (page: string) => dispatch({ type: 'SET_PAGE', page });

  const renderPage = () => {
    switch (state.activePage) {
      case 'today': return <Today state={state} dispatch={dispatch} />;
      case 'week': return <Week state={state} dispatch={dispatch} />;
      case 'projects': return <Projects state={state} dispatch={dispatch} />;
      case 'focus': return <Focus state={state} dispatch={dispatch} />;
      case 'settings': return <Settings state={state} dispatch={dispatch} />;
      default: return <Today state={state} dispatch={dispatch} />;
    }
  };

  return (
    <div className="shell">
      <TopBar
        theme={state.theme}
        onToggleTheme={() => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })}
      />
      <SideBar activePage={state.activePage} onNavigate={navigate} />
      <main className="content">{renderPage()}</main>
    </div>
  );
}
