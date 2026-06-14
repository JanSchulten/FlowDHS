import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: Props) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      setDateStr(
        new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
      );
    };
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <header className="topbar">
      <div className="logo">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <circle cx="13" cy="13" r="11" stroke="currentColor" strokeWidth="2" />
          <path d="M8 13h5.5M8 9.5h10M8 16.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="19" cy="16.5" r="2.8" fill="currentColor" opacity=".8" />
        </svg>
        FocusFlow
      </div>
      <div className="topbar-r">
        <span className="date-chip">{dateStr}</span>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title="Theme wechseln"
          aria-label="Theme wechseln"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
