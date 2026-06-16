import { Moon, Sun, Search, Cloud, LogIn, Plus, Layers, CalendarClock, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SyncState, AppUser } from '../../types';
import { LevelWidget } from '../ui/LevelWidget';

interface Props {
  theme: 'dark' | 'light';
  xp: number;
  streak: number;
  sync: SyncState;
  user: AppUser | null;
  onToggleTheme: () => void;
  onOpenCommand: () => void;
  onOpenSettings: () => void;
  onNewProject: () => void;
  onNewFixture: () => void;
}

export function TopBar({
  theme, xp, streak, sync, user,
  onToggleTheme, onOpenCommand, onOpenSettings, onNewProject, onNewFixture,
}: Props) {
  const [dateStr, setDateStr] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      setDateStr(new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, []);

  // Close the quick-add menu on outside click or Escape.
  useEffect(() => {
    if (!addOpen) return;
    const onDown = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAddOpen(false); };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [addOpen]);

  const syncLabel =
    sync.status === 'connected' ? 'Sync' :
    sync.status === 'syncing' ? 'Sync…' :
    sync.status === 'error' ? 'Fehler' : 'Cloud';

  return (
    <header className="topbar">
      <div className="logo">
        <span className="logo-mark">
          <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="11" stroke="currentColor" strokeWidth="2.4" />
            <path d="M8 13h5.5M8 9.5h10M8 16.5h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
        FlowDHS
      </div>

      <button className="cmd-trigger" onClick={onOpenCommand} aria-label="Befehlspalette öffnen">
        <Search size={14} />
        <span>Suchen oder springen…</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="quick-add" ref={addRef}>
        <button
          className="btn btn-pri btn-sm quick-add-btn"
          onClick={() => setAddOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={addOpen}
          aria-label="Neu erstellen"
        >
          <Plus size={15} /> <span className="quick-add-label">Neu</span>
        </button>
        {addOpen && (
          <>
            <div className="quick-add-backdrop" onClick={() => setAddOpen(false)} />
            <div className="quick-add-menu" role="menu">
              <div className="quick-add-menu-hdr">
                <span>Neu erstellen</span>
                <button className="quick-add-close" onClick={() => setAddOpen(false)} aria-label="Schließen">
                  <X size={16} />
                </button>
              </div>
              <button className="quick-add-item" role="menuitem" onClick={() => { setAddOpen(false); onNewProject(); }}>
                <Layers size={15} />
                <span>
                  <strong>Neues Projekt</strong>
                  <small>Aufgabe mit Deadline & Schritten</small>
                </span>
              </button>
              <button className="quick-add-item" role="menuitem" onClick={() => { setAddOpen(false); onNewFixture(); }}>
                <CalendarClock size={15} />
                <span>
                  <strong>Neuer Termin</strong>
                  <small>Fester, zeitgebundener Termin</small>
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-r">
        <span className="date-chip">{dateStr}</span>
        {streak > 0 && <span className="streak-chip">🔥 {streak}</span>}

        {user ? (
          <button
            className={`sync-chip ${sync.status}`}
            onClick={onOpenSettings}
            title={sync.message || 'Cloud-Sync (Supabase)'}
            aria-label="Konto & Sync-Status"
          >
            {user.avatar
              ? <img src={user.avatar} alt="" width={16} height={16} style={{ borderRadius: '50%' }} referrerPolicy="no-referrer" />
              : <Cloud size={12} />}
            {syncLabel}
          </button>
        ) : (
          <button className="sync-chip" onClick={onOpenSettings} title="Mit Google anmelden" aria-label="Anmelden">
            <LogIn size={12} />
            Anmelden
          </button>
        )}

        <LevelWidget xp={xp} onClick={onOpenSettings} />
        <button className="icon-btn" onClick={onToggleTheme} title="Theme wechseln" aria-label="Theme wechseln">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
