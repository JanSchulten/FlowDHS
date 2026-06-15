import { Moon, Sun, Search, Cloud, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
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
}

export function TopBar({ theme, xp, streak, sync, user, onToggleTheme, onOpenCommand, onOpenSettings }: Props) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      setDateStr(new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, []);

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
        FocusFlow
      </div>

      <button className="cmd-trigger" onClick={onOpenCommand} aria-label="Befehlspalette öffnen">
        <Search size={14} />
        <span>Suchen oder springen…</span>
        <kbd>⌘K</kbd>
      </button>

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
