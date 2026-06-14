import { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import type { Project, Subtask, Priority, Tag } from '../../types';
import { Modal } from '../ui/Modal';
import { uid } from '../../engine/utils';

interface Props {
  open: boolean;
  editProject: Project | null;
  onClose: () => void;
  onSave: (data: Omit<Project, 'id' | 'createdAt'>) => void;
}

const EMPTY_FORM = {
  name: '',
  deadline: '',
  weekBudgetH: 2,
  priority: 'med' as Priority,
  tag: 'focus' as Tag,
  estimateH: 4,
};

export function ProjectModal({ open, editProject, onClose, onSave }: Props) {
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
      done: editProject?.done ?? false,
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
            <option value="focus">🎯 Deep Work</option>
            <option value="creative">🎨 Kreativ</option>
            <option value="energy">⚡ High Energy</option>
            <option value="admin">📋 Admin</option>
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

      <div style={{ borderTop: '1px solid var(--div)', margin: '.5rem -1.5rem', padding: '.75rem 1.5rem 0' }}>
        <div style={{ fontSize: 'var(--tx-sm)', fontWeight: 600, marginBottom: '.5rem' }}>Unteraufgaben (optional)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem', marginBottom: '.5rem' }}>
          {subtasks.map((s) => (
            <div
              key={s.id}
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.25rem .25rem', background: 'var(--surf3)', borderRadius: 'var(--r-md)' }}
            >
              <span style={{ flex: 1, fontSize: 'var(--tx-xs)' }}>{s.name}</span>
              <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>{s.dur}m</span>
              <button
                className="icon-btn"
                style={{ width: 20, height: 20 }}
                onClick={() => removeSubtask(s.id)}
                aria-label={`Unteraufgabe entfernen: ${s.name}`}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="input"
            placeholder="Unteraufgabe..."
            style={{ flex: 1 }}
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            aria-label="Neue Unteraufgabe Name"
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
            aria-label="Unteraufgabe Dauer in Minuten"
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={addSubtask}
            aria-label="Unteraufgabe hinzufügen"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
