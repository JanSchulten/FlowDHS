import { useState } from 'react';
import { CalendarClock, Lock, LayoutGrid, Trash2, Pencil, Plus, X } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import type { Fixture, FixtureKind, Tag } from '../../types';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

// Presentation order Mon→Sun, mapped to JS getDay() indices.
const WEEK: { i: number; label: string }[] = [
  { i: 1, label: 'Mo' }, { i: 2, label: 'Di' }, { i: 3, label: 'Mi' },
  { i: 4, label: 'Do' }, { i: 5, label: 'Fr' }, { i: 6, label: 'Sa' }, { i: 0, label: 'So' },
];

const TAGS: Tag[] = ['focus', 'creative', 'energy', 'admin'];

const emptyForm = {
  id: '' as string,
  name: '',
  kind: 'block' as FixtureKind,
  start: '09:00',
  end: '17:00',
  days: new Set<number>([1, 2, 3, 4, 5]),
  date: '',
  tag: 'admin' as Tag,
};

function recurrenceLabel(f: Fixture): string {
  if (f.days && f.days.length > 0) {
    return WEEK.filter((w) => f.days.includes(w.i)).map((w) => w.label).join(', ');
  }
  if (f.date) return new Date(`${f.date}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  return '—';
}

export function Fixtures({ state, dispatch }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const editing = form.id !== '';

  const toggleDay = (i: number) => {
    const days = new Set(form.days);
    if (days.has(i)) days.delete(i); else days.add(i);
    setForm({ ...form, days });
  };

  const reset = () => setForm({ ...emptyForm, days: new Set([1, 2, 3, 4, 5]) });

  const save = () => {
    if (!form.name.trim()) return;
    const usesWeekdays = form.days.size > 0;
    const payload: Omit<Fixture, 'id'> = {
      name: form.name.trim(),
      kind: form.kind,
      start: form.start,
      end: form.end,
      days: usesWeekdays ? [...form.days] : [],
      date: usesWeekdays ? null : (form.date || null),
      tag: form.tag,
    };
    if (editing) dispatch({ type: 'UPDATE_FIXTURE', payload: { ...payload, id: form.id } });
    else dispatch({ type: 'ADD_FIXTURE', payload });
    reset();
  };

  const edit = (f: Fixture) => {
    setForm({
      id: f.id, name: f.name, kind: f.kind, start: f.start, end: f.end,
      days: new Set(f.days ?? []), date: f.date ?? '', tag: f.tag ?? 'admin',
    });
  };

  const assignedCount = (id: string) => state.projects.filter((p) => p.fixtureId === id && !p.done).length;

  return (
    <div>
      <h1 className="pg-title">Fixtermine ⏰</h1>
      <p className="pg-sub">
        Feste, zeitlich gebundene Termine wie Arbeit. <strong>Sperre</strong> = in dem Zeitraum
        wird nichts anderes geplant. <strong>Fenster</strong> = nur zugewiesene Projekte werden
        in diesem Zeitraum eingeplant.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">
          {editing ? <Pencil size={16} /> : <Plus size={16} />} {editing ? 'Fixtermin bearbeiten' : 'Neuer Fixtermin'}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="fx-name">Name</label>
          <input id="fx-name" className="input" placeholder="z. B. Arbeit, Uni, Sport"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Art</label>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${form.kind === 'block' ? 'btn-pri' : 'btn-ghost'}`}
              onClick={() => setForm({ ...form, kind: 'block' })} aria-pressed={form.kind === 'block'}
            >
              <Lock size={13} /> Sperre (geblockt)
            </button>
            <button
              className={`btn btn-sm ${form.kind === 'container' ? 'btn-pri' : 'btn-ghost'}`}
              onClick={() => setForm({ ...form, kind: 'container' })} aria-pressed={form.kind === 'container'}
            >
              <LayoutGrid size={13} /> Fenster (für Projekte)
            </button>
          </div>
        </div>

        <div className="input-row">
          <div className="form-group">
            <label className="form-label" htmlFor="fx-start">Von</label>
            <input id="fx-start" className="input" type="time" value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="fx-end">Bis</label>
            <input id="fx-end" className="input" type="time" value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Wiederholung (Wochentage)</label>
          <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
            {WEEK.map((w) => (
              <button key={w.i}
                className={`btn btn-sm ${form.days.has(w.i) ? 'btn-pri' : 'btn-ghost'}`}
                style={{ minWidth: 42 }}
                onClick={() => toggleDay(w.i)} aria-pressed={form.days.has(w.i)} aria-label={w.label}
              >
                {w.label}
              </button>
            ))}
          </div>
          <div className="form-hint">
            Keine Wochentage gewählt? Dann gilt der Termin einmalig an einem Datum:
          </div>
          {form.days.size === 0 && (
            <input className="input" type="date" value={form.date} style={{ marginTop: '.4rem' }}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Farbe / Typ</label>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {TAGS.map((t) => (
              <button key={t} className={`tag tag-${t}`} style={{ cursor: 'pointer', opacity: form.tag === t ? 1 : 0.45 }}
                onClick={() => setForm({ ...form, tag: t })} aria-pressed={form.tag === t}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-pri" onClick={save} aria-label="Fixtermin speichern">
            {editing ? 'Speichern' : 'Hinzufügen'}
          </button>
          {editing && (
            <button className="btn btn-ghost" onClick={reset} aria-label="Abbrechen"><X size={14} /> Abbrechen</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title"><CalendarClock size={16} /> Deine Fixtermine</div>
        {state.fixtures.length === 0 ? (
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx3)' }}>
            Noch keine Fixtermine. Lege oben z. B. „Arbeit" an.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {[...state.fixtures].sort((a, b) => a.start.localeCompare(b.start)).map((f) => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .75rem',
                border: '1px solid var(--bdr)', borderRadius: 'var(--r2, 10px)', background: 'var(--bg2)',
              }}>
                <span className={`tag tag-${f.tag ?? 'admin'}`} style={{ flexShrink: 0 }}>
                  {f.kind === 'block' ? '🔒' : '🪟'}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--tx-sm)' }}>{f.name}</div>
                  <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)' }}>
                    {f.start}–{f.end} · {recurrenceLabel(f)} · {f.kind === 'block' ? 'gesperrt' : `Fenster (${assignedCount(f.id)} Projekte)`}
                  </div>
                </div>
                <button className="icon-btn" onClick={() => edit(f)} aria-label="Bearbeiten"><Pencil size={14} /></button>
                <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_FIXTURE', id: f.id })} aria-label="Löschen"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
