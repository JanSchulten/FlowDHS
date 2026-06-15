import { useState, useEffect, useRef, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

interface Props {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

export function CommandPalette({ open, commands, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q));
  }, [query, commands]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[active]?.run(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div
      className={`cmd-overlay ${open ? 'open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Befehlspalette"
    >
      <div className="cmd-panel" onKeyDown={onKeyDown}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Befehl suchen oder springen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Befehl suchen"
        />
        <div className="cmd-list">
          {filtered.length === 0 ? (
            <div className="cmd-empty">Nichts gefunden</div>
          ) : (
            filtered.map((c, i) => (
              <div
                key={c.id}
                className={`cmd-item ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => c.run()}
                role="button"
              >
                <c.icon className="cmd-ico" size={18} />
                <span>{c.label}</span>
                {c.hint && <span className="cmd-item-hint">{c.hint}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
