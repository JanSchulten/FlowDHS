import { useState, useEffect } from 'react';
import { Check, Lock, LayoutGrid, Layers } from 'lucide-react';
import type { Fixture, FixtureKind, Tag, WorkContext } from '../../types';
import { Modal } from '../ui/Modal';
import { TimePicker } from '../ui/TimePicker';

interface Props {
  open: boolean;
  editFixture: Fixture | null;
  onClose: () => void;
  onSave: (data: Omit<Fixture, 'id'>) => void;
}

const WEEK: { i: number; label: string; short: string }[] = [
  { i: 1, label: 'Montag', short: 'Mo' },
  { i: 2, label: 'Dienstag', short: 'Di' },
  { i: 3, label: 'Mittwoch', short: 'Mi' },
  { i: 4, label: 'Donnerstag', short: 'Do' },
  { i: 5, label: 'Freitag', short: 'Fr' },
  { i: 6, label: 'Samstag', short: 'Sa' },
  { i: 0, label: 'Sonntag', short: 'So' },
];

const BUILTIN_TAGS: { value: Tag; label: string }[] = [
  { value: 'focus', label: '🎯 Deep Work' },
  { value: 'creative', label: '🎨 Kreativ' },
  { value: 'energy', label: '⚡ High Energy' },
  { value: 'admin', label: '📋 Admin' },
];

const EMPTY = {
  name: '',
  kind: 'block' as FixtureKind,
  start: '09:00',
  end: '10:00',
  days: new Set<number>(),
  date: '',
  tag: 'admin' as Tag,
  workContext: 'work' as WorkContext,
  parallelCapacity: 50,
};

const KIND_OPTIONS: { value: FixtureKind; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'block', label: 'Sperre', desc: 'Kein anderes Element wird in diesem Zeitraum geplant.', icon: <Lock size={14} /> },
  { value: 'container', label: 'Fenster', desc: 'Nur zugewiesene Projekte werden in diesem Zeitraum eingeplant.', icon: <LayoutGrid size={14} /> },
  { value: 'parallel', label: 'Parallel', desc: 'Aufgaben können mit reduzierter Kapazität daneben laufen.', icon: <Layers size={14} /> },
];

export function FixtureModal({ open, editFixture, onClose, onSave }: Props) {
  const [form, setForm] = useState({ ...EMPTY });

  useEffect(() => {
    if (!open) return;
    if (editFixture) {
      setForm({
        name: editFixture.name,
        kind: editFixture.kind,
        start: editFixture.start,
        end: editFixture.end,
        days: new Set(editFixture.days ?? []),
        date: editFixture.date ?? '',
        tag: editFixture.tag ?? 'admin',
        workContext: editFixture.workContext ?? 'work',
        parallelCapacity: editFixture.parallelCapacity ?? 50,
      });
    } else {
      setForm({ ...EMPTY, days: new Set() });
    }
  }, [open, editFixture]);

  const toggleDay = (i: number) => {
    const days = new Set(form.days);
    if (days.has(i)) days.delete(i); else days.add(i);
    setForm({ ...form, days });
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) return;
    const usesWeekdays = form.days.size > 0;
    onSave({
      name,
      kind: form.kind,
      start: form.start,
      end: form.end,
      days: usesWeekdays ? [...form.days] : [],
      date: usesWeekdays ? null : (form.date || null),
      tag: form.tag,
      workContext: form.workContext,
      parallelCapacity: form.kind === 'parallel' ? form.parallelCapacity : undefined,
    });
  };

  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
      <button className="btn btn-pri" onClick={handleSave}>
        <Check size={14} /> Speichern
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      title={editFixture ? 'Termin bearbeiten' : 'Neuer Termin'}
      onClose={onClose}
      footer={footer}
    >
      <div className="form-group">
        <label className="form-label" htmlFor="fxm-name">Name *</label>
        <input
          id="fxm-name"
          className="input"
          placeholder="z. B. Arbeit, Uni, Sport"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoComplete="off"
        />
      </div>

      {/* Kind selector */}
      <div className="form-group">
        <label className="form-label">Art des Termins</label>
        <div className="kind-grid">
          {KIND_OPTIONS.map((k) => (
            <button
              key={k.value}
              className={`kind-option ${form.kind === k.value ? 'selected' : ''}`}
              onClick={() => setForm({ ...form, kind: k.value })}
              aria-pressed={form.kind === k.value}
            >
              <span className="kind-icon">{k.icon}</span>
              <span className="kind-label">{k.label}</span>
              <span className="kind-desc">{k.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Parallel capacity */}
      {form.kind === 'parallel' && (
        <div className="form-group">
          <label className="form-label" htmlFor="fxm-cap">Verfügbare Kapazität neben dem Termin</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <input
              id="fxm-cap"
              className="input"
              type="range"
              min={10}
              max={100}
              step={10}
              value={form.parallelCapacity}
              onChange={(e) => setForm({ ...form, parallelCapacity: parseInt(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 700, minWidth: 42, textAlign: 'right' }}>
              {form.parallelCapacity}%
            </span>
          </div>
          <div className="form-hint">
            {form.parallelCapacity === 100 ? 'Volle Kapazität nebenbei möglich.' :
             form.parallelCapacity! >= 50 ? 'Halbe Kapazität — leichtere Aufgaben passen gut.' :
             'Niedrige Kapazität — nur kurze Pufferaufgaben.'}
          </div>
        </div>
      )}

      {/* Time pickers */}
      <div className="input-row" style={{ gap: '1.5rem' }}>
        <TimePicker label="Von" id="fxm-start" value={form.start} onChange={(v) => setForm({ ...form, start: v })} />
        <TimePicker label="Bis" id="fxm-end" value={form.end} onChange={(v) => setForm({ ...form, end: v })} />
      </div>

      {/* Work / private context */}
      <div className="form-group">
        <label className="form-label">Kontext</label>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {(['work', 'private'] as WorkContext[]).map((ctx) => (
            <button
              key={ctx}
              className={`btn btn-sm ${form.workContext === ctx ? 'btn-pri' : 'btn-ghost'}`}
              onClick={() => setForm({ ...form, workContext: ctx })}
              aria-pressed={form.workContext === ctx}
            >
              {ctx === 'work' ? '💼 Arbeit' : '🏠 Privat'}
            </button>
          ))}
        </div>
        <div className="form-hint">
          {form.workContext === 'work'
            ? 'Nur Arbeitsprojekte + private Projekte (mit Erlaubnis) werden hier eingeplant.'
            : 'Nur private Projekte werden hier eingeplant.'}
        </div>
      </div>

      {/* Weekday toggles */}
      <div className="form-group">
        <label className="form-label">Wochentage (Wiederholung)</label>
        <div className="day-toggle-row">
          {WEEK.map((w) => (
            <button
              key={w.i}
              className={`day-toggle ${form.days.has(w.i) ? 'active' : ''}`}
              onClick={() => toggleDay(w.i)}
              aria-pressed={form.days.has(w.i)}
              aria-label={w.label}
              title={w.label}
            >
              {w.short}
            </button>
          ))}
        </div>
        <div className="form-hint">Keine Auswahl = einmaliger Termin an einem bestimmten Datum.</div>
        {form.days.size === 0 && (
          <input
            className="input"
            type="date"
            value={form.date}
            style={{ marginTop: '.4rem' }}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        )}
      </div>

      {/* Tag */}
      <div className="form-group">
        <label className="form-label" htmlFor="fxm-tag">Farbe / Typ</label>
        <select
          id="fxm-tag"
          className="input"
          value={form.tag}
          onChange={(e) => setForm({ ...form, tag: e.target.value })}
        >
          {BUILTIN_TAGS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
}
