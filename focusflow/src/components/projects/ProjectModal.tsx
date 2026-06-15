import { useState, useEffect } from 'react';
import { Plus, X, Check, Axe } from 'lucide-react';
import type { Project, Subtask, Priority, Tag, BoardStatus, Fixture, WorkContext, CustomCategory } from '../../types';
import { Modal } from '../ui/Modal';
import { uid } from '../../engine/utils';
import { suggestSteps } from '../../engine/breakdown';

interface Props {
  open: boolean;
  editProject: Project | null;
  containers: Fixture[];
  customCategories: CustomCategory[];
  onClose: () => void;
  onSave: (data: Omit<Project, 'id' | 'createdAt'>) => void;
}

const BUILTIN_TAGS: { value: Tag; label: string }[] = [
  { value: 'focus', label: '🎯 Deep Work' },
  { value: 'creative', label: '🎨 Kreativ' },
  { value: 'energy', label: '⚡ High Energy' },
  { value: 'admin', label: '📋 Admin' },
];

const EMPTY_FORM = {
  name: '',
  deadline: '',
  weekBudgetH: 2,
  priority: 'med' as Priority,
  tag: 'focus' as Tag,
  estimateH: 4,
  status: 'backlog' as BoardStatus,
  fixtureId: '',
  workContext: 'work' as WorkContext,
};

export function ProjectModal({ open, editProject, containers, customCategories, onClose, onSave }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDur, setNewSubDur] = useState(25);

  useEffect(() => {
    if (open) {
      if (editProject) {
        setForm({
          name: editProject.name,
          deadline: editProject.deadline ?? '',
          weekBudgetH: editProject.weekBudgetH,
          priority: editProject.priority,
          tag: editProject.tag,
          estimateH: Math.round((editProject.estimateMins / 60) * 10) / 10,
          status: editProject.status,
          fixtureId: editProject.fixtureId ?? '',
          workContext: editProject.workContext ?? 'work',
        });
        setSubtasks([...(editProject.subtasks ?? [])]);
      } else {
        setForm(EMPTY_FORM);
        setSubtasks([]);
      }
      setNewSubName('');
      setNewSubDur(25);
    }
  }, [open, editProject]);

  const addSubtask = () => {
    const name = newSubName.trim();
    if (!name) return;
    setSubtasks((prev) => [...prev, { id: uid(), name, dur: newSubDur, done: false }]);
    setNewSubName('');
    setNewSubDur(25);
  };

  const removeSubtask = (id: string) => setSubtasks((prev) => prev.filter((s) => s.id !== id));

  const autoBreakdown = () => {
    const steps = suggestSteps({
      name: form.name || 'Projekt',
      estimateMins: Math.round(form.estimateH * 60),
      tag: form.tag,
    });
    setSubtasks((prev) => [...prev, ...steps.map((s) => ({ ...s, id: uid() }))]);
  };

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) return;
    onSave({
      name,
      deadline: form.deadline || null,
      weekBudgetH: form.weekBudgetH,
      priority: form.priority,
      tag: form.tag,
      estimateMins: Math.round(form.estimateH * 60),
      status: form.status,
      done: form.status === 'done' || (editProject?.done ?? false),
      actualMins: editProject?.actualMins ?? 0,
      note: editProject?.note,
      fixtureId: form.fixtureId || undefined,
      workContext: form.workContext,
      subtasks,
    });
  };

  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
      <button className="btn btn-pri" onClick={handleSave} aria-label="Projekt speichern">
        <Check size={14} /> Speichern
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      title={editProject ? 'Projekt bearbeiten' : 'Projekt hinzufügen'}
      onClose={onClose}
      footer={footer}
    >
      <div className="form-group">
        <label className="form-label" htmlFor="m-name">Name *</label>
        <input
          id="m-name"
          className="input"
          placeholder="z.B. Dissertation Kapitel 3, Unity-Shader"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoComplete="off"
        />
      </div>

      <div className="input-row">
        <div className="form-group">
          <label className="form-label" htmlFor="m-deadline">Deadline</label>
          <input
            id="m-deadline"
            className="input"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          />
          <div className="form-hint">Leer lassen = kein Termin</div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="m-budget">Wochenbudget (Stunden)</label>
          <input
            id="m-budget"
            className="input"
            type="number"
            min={0.5}
            max={40}
            step={0.5}
            value={form.weekBudgetH}
            onChange={(e) => setForm((f) => ({ ...f, weekBudgetH: parseFloat(e.target.value) || 2 }))}
          />
          <div className="form-hint">Wieviel Zeit/Woche möchtest du investieren?</div>
        </div>
      </div>

      <div className="input-row3">
        <div className="form-group">
          <label className="form-label" htmlFor="m-prio">Priorität</label>
          <select
            id="m-prio"
            className="input"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
          >
            <option value="high">🔴 Hoch</option>
            <option value="med">🟡 Mittel</option>
            <option value="low">🟢 Niedrig</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="m-tag">Typ</label>
          <select
            id="m-tag"
            className="input"
            value={form.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value as Tag }))}
          >
            {BUILTIN_TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            {customCategories.length > 0 && <optgroup label="Eigene Kategorien">
              {customCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="m-estimate">Geschätzte Zeit (h)</label>
          <input
            id="m-estimate"
            className="input"
            type="number"
            min={0.5}
            step={0.5}
            value={form.estimateH}
            onChange={(e) => setForm((f) => ({ ...f, estimateH: parseFloat(e.target.value) || 4 }))}
          />
          <div className="form-hint">Gesamtaufwand</div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="m-status">Spalte</label>
        <select
          id="m-status"
          className="input"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BoardStatus }))}
        >
          <option value="backlog">Backlog</option>
          <option value="today">Heute</option>
          <option value="doing">In Arbeit</option>
          <option value="done">Erledigt</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Kontext</label>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {(['work', 'private'] as WorkContext[]).map((ctx) => (
            <button
              key={ctx}
              className={`btn btn-sm ${form.workContext === ctx ? 'btn-pri' : 'btn-ghost'}`}
              onClick={() => setForm((f) => ({ ...f, workContext: ctx }))}
              aria-pressed={form.workContext === ctx}
            >
              {ctx === 'work' ? '💼 Arbeit' : '🏠 Privat'}
            </button>
          ))}
        </div>
        <div className="form-hint">
          Private Projekte können in Arbeitszeiträume eingeplant werden — nicht umgekehrt.
        </div>
      </div>

      {containers.length > 0 && (
        <div className="form-group">
          <label className="form-label" htmlFor="m-fixture">Nur in diesem Fenster planen</label>
          <select
            id="m-fixture"
            className="input"
            value={form.fixtureId}
            onChange={(e) => setForm((f) => ({ ...f, fixtureId: e.target.value }))}
          >
            <option value="">— Frei (überall planbar) —</option>
            {containers.map((c) => (
              <option key={c.id} value={c.id}>🪟 {c.name} ({c.start}–{c.end})</option>
            ))}
          </select>
          <div className="form-hint">Bindet das Projekt an einen Fixtermin vom Typ „Fenster".</div>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--div)', margin: '.5rem -1.5rem', padding: '.75rem 1.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 600 }}>Schritte / Unteraufgaben</span>
          <button className="btn btn-ghost btn-sm" onClick={autoBreakdown} aria-label="Automatisch in Schritte zerlegen">
            <Axe size={13} /> Auto-zerlegen
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem', marginBottom: '.5rem' }}>
          {subtasks.map((s) => (
            <div
              key={s.id}
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.3rem .35rem', background: 'var(--surf3)', borderRadius: 'var(--r-md)' }}
            >
              <span style={{ flex: 1, fontSize: 'var(--tx-xs)' }}>{s.name}</span>
              <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>{s.dur}m</span>
              <button
                className="icon-btn"
                style={{ width: 20, height: 20 }}
                onClick={() => removeSubtask(s.id)}
                aria-label={`Schritt entfernen: ${s.name}`}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="input"
            placeholder="Schritt..."
            style={{ flex: 1 }}
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            aria-label="Neuer Schritt Name"
          />
          <input
            className="input"
            type="number"
            min={5}
            step={5}
            value={newSubDur}
            onChange={(e) => setNewSubDur(parseInt(e.target.value) || 25)}
            placeholder="Min"
            style={{ width: 72 }}
            aria-label="Schritt Dauer in Minuten"
          />
          <button className="btn btn-ghost btn-sm" onClick={addSubtask} aria-label="Schritt hinzufügen">
            <Plus size={13} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
