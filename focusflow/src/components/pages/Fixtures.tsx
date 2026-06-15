import { useState } from 'react';
import { CalendarClock, Trash2, Pencil, Plus } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import type { Fixture } from '../../types';
import { FixtureModal } from '../projects/FixtureModal';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const WEEK: { i: number; label: string }[] = [
  { i: 1, label: 'Mo' }, { i: 2, label: 'Di' }, { i: 3, label: 'Mi' },
  { i: 4, label: 'Do' }, { i: 5, label: 'Fr' }, { i: 6, label: 'Sa' }, { i: 0, label: 'So' },
];

const KIND_LABELS: Record<string, string> = {
  block: '🔒 Sperre',
  container: '🪟 Fenster',
  parallel: '⚡ Parallel',
};

function recurrenceLabel(f: Fixture): string {
  if (f.days && f.days.length > 0) {
    return WEEK.filter((w) => f.days.includes(w.i)).map((w) => w.label).join(', ');
  }
  if (f.date) return new Date(`${f.date}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
  return '—';
}

export function Fixtures({ state, dispatch }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editFixture, setEditFixture] = useState<Fixture | null>(null);

  const openNew = () => { setEditFixture(null); setModalOpen(true); };
  const openEdit = (f: Fixture) => { setEditFixture(f); setModalOpen(true); };

  const handleSave = (data: Omit<Fixture, 'id'>) => {
    if (editFixture) {
      dispatch({ type: 'UPDATE_FIXTURE', payload: { ...data, id: editFixture.id } });
    } else {
      dispatch({ type: 'ADD_FIXTURE', payload: data });
    }
    setModalOpen(false);
    setEditFixture(null);
  };

  const assignedCount = (id: string) => state.projects.filter((p) => p.fixtureId === id && !p.done).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="pg-title">Fixtermine ⏰</h1>
          <p className="pg-sub" style={{ marginBottom: 0 }}>
            <strong>Sperre</strong> = nichts anderes wird geplant.{' '}
            <strong>Fenster</strong> = nur zugewiesene Projekte werden darin eingeplant.{' '}
            <strong>Parallel</strong> = Aufgaben laufen mit reduzierter Kapazität daneben.
          </p>
        </div>
        <button className="btn btn-pri" onClick={openNew} aria-label="Neuen Termin anlegen">
          <Plus size={15} /> Neuer Termin
        </button>
      </div>

      <div className="card">
        <div className="card-title"><CalendarClock size={16} /> Deine Fixtermine</div>
        {state.fixtures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CalendarClock size={32} strokeWidth={1.2} style={{ color: 'var(--tx3)', marginBottom: '.5rem' }} />
            <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx3)' }}>Noch keine Fixtermine.</p>
            <button className="btn btn-pri" style={{ marginTop: '.75rem' }} onClick={openNew}>
              <Plus size={14} /> Ersten Termin anlegen
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {[...state.fixtures].sort((a, b) => a.start.localeCompare(b.start)).map((f) => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.65rem .75rem',
                border: '1px solid var(--bdr)', borderRadius: 'var(--r-lg)', background: 'var(--surf2)',
              }}>
                <span className={`tag tag-${f.tag ?? 'admin'}`} style={{ flexShrink: 0 }}>
                  {f.kind === 'block' ? '🔒' : f.kind === 'parallel' ? '⚡' : '🪟'}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--tx-sm)' }}>{f.name}</div>
                  <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)' }}>
                    {f.start}–{f.end} · {recurrenceLabel(f)} · {KIND_LABELS[f.kind]}
                    {f.kind === 'container' && ` (${assignedCount(f.id)} Projekte)`}
                    {f.kind === 'parallel' && f.parallelCapacity != null && ` · ${f.parallelCapacity}% Kap.`}
                    {f.workContext === 'private' && ' · 🏠 Privat'}
                  </div>
                </div>
                <button className="icon-btn" onClick={() => openEdit(f)} aria-label="Bearbeiten"><Pencil size={14} /></button>
                <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_FIXTURE', id: f.id })} aria-label="Löschen"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FixtureModal
        open={modalOpen}
        editFixture={editFixture}
        onClose={() => { setModalOpen(false); setEditFixture(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
