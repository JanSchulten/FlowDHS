import { useState, useRef } from 'react';
import { Plus, ArrowRight, X, Brain } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function Inbox({ state, dispatch }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    if (!text.trim()) return;
    dispatch({ type: 'ADD_BRAINDUMP', text });
    setText('');
    inputRef.current?.focus();
  };

  return (
    <div>
      <h1 className="pg-title">Brain-Dump 🧠</h1>
      <p className="pg-sub">
        Kopf voll? Wirf alles hier rein — ohne nachzudenken. Sortieren kannst du später.
        Das entlastet dein Arbeitsgedächtnis und reduziert Überforderung.
      </p>

      <div className="dump-capture">
        <input
          ref={inputRef}
          className="input"
          placeholder="Was geht dir durch den Kopf?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          aria-label="Gedanke erfassen"
          autoFocus
        />
        <button className="btn btn-pri" onClick={add} aria-label="Erfassen">
          <Plus size={16} /> Rein damit
        </button>
      </div>

      {state.brainDump.length === 0 ? (
        <div className="empty">
          <Brain />
          <h3>Kopf ist leer ✨</h3>
          <p>Alles erfasst. Wenn dir etwas einfällt, landet es hier in Sekunden.</p>
        </div>
      ) : (
        <div className="dump-list">
          {state.brainDump.map((item) => (
            <div key={item.id} className="dump-item">
              <span className="dump-text">{item.text}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => dispatch({ type: 'CONVERT_BRAINDUMP', id: item.id })}
                aria-label={`In Projekt umwandeln: ${item.text}`}
              >
                <ArrowRight size={13} /> Projekt
              </button>
              <button
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                onClick={() => dispatch({ type: 'DELETE_BRAINDUMP', id: item.id })}
                aria-label={`Löschen: ${item.text}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
