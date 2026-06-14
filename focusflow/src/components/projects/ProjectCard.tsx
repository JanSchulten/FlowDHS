import { useState, useRef } from 'react';
import { Pencil, Trash2, Check, Plus } from 'lucide-react';
import type { Project } from '../../types';
import { DeadlineChip } from '../ui/DeadlineChip';
import { SubtaskItem } from './SubtaskItem';
import { tagLabel } from '../../engine/utils';

const PRIO_LABELS: Record<string, string> = {
  high: '🔴 Hoch',
  med: '🟡 Mittel',
  low: '🟢 Niedrig',
};

interface Props {
  project: Project;
  onComplete: (id: string) => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (pid: string, sid: string) => void;
  onDeleteSubtask: (pid: string, sid: string) => void;
  onAddSubtask: (pid: string, name: string, dur: number) => void;
}

export function ProjectCard({
  project,
  onComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const durRef = useRef<HTMLInputElement>(null);

  const subtasks = project.subtasks ?? [];
  const doneSubs = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length
    ? Math.round((doneSubs / subtasks.length) * 100)
    : project.done
    ? 100
    : 0;

  const handleAddSubtask = () => {
    const name = nameRef.current?.value.trim();
    if (!name) return;
    const dur = parseInt(durRef.current?.value ?? '25') || 25;
    onAddSubtask(project.id, name, dur);
    if (nameRef.current) nameRef.current.value = '';
    if (durRef.current) durRef.current.value = '25';
  };

  return (
    <div className={`project-card ${project.done ? 'done' : ''}`}>
      <div className="project-header" onClick={() => setExpanded((v) => !v)}>
        <div
          className="project-checkbox"
          onClick={(e) => { e.stopPropagation(); onComplete(project.id); }}
          role="checkbox"
          aria-checked={project.done}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onComplete(project.id)}
          aria-label={`Projekt ${project.done ? 'aktiv' : 'abschließen'}: ${project.name}`}
        >
          {project.done && <Check size={13} strokeWidth={3} />}
        </div>

        <div>
          <div className="project-title">{project.name}</div>
          <div className="project-meta">
            <span className={`tag tag-${project.tag}`}>{tagLabel(project.tag)}</span>
            <span className={`prio prio-${project.priority}`}>{PRIO_LABELS[project.priority]}</span>
            {project.deadline && <DeadlineChip deadline={project.deadline} done={project.done} />}
            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)' }}>
              {project.weekBudgetH}h/Woche · ~{Math.round((project.estimateMins / 60) * 10) / 10}h gesamt
            </span>
            {subtasks.length > 0 && (
              <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)' }}>
                {doneSubs}/{subtasks.length} Subtasks
              </span>
            )}
          </div>
          <div className="progress-track" style={{ marginTop: '.375rem', width: 200, maxWidth: '100%' }}>
            <div
              className="progress-fill"
              style={{ width: `${pct}%`, background: pct === 100 ? 'var(--ok)' : 'var(--pri)' }}
            />
          </div>
        </div>

        <div className="project-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="icon-btn btn-sm"
            onClick={() => onEdit(project)}
            aria-label={`Projekt bearbeiten: ${project.name}`}
          >
            <Pencil size={13} />
          </button>
          <button
            className="icon-btn btn-sm"
            onClick={() => { if (confirm('Projekt löschen?')) onDelete(project.id); }}
            aria-label={`Projekt löschen: ${project.name}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className={`project-body ${expanded ? '' : 'collapsed'}`}>
        {subtasks.length > 0 && (
          <div className="subtask-list">
            {subtasks.map((st) => (
              <SubtaskItem
                key={st.id}
                projectId={project.id}
                subtask={st}
                onToggle={onToggleSubtask}
                onDelete={onDeleteSubtask}
              />
            ))}
          </div>
        )}
        <div className="add-subtask-row">
          <input
            ref={nameRef}
            className="input"
            placeholder="Neue Unteraufgabe..."
            style={{ flex: 1, fontSize: 'var(--tx-xs)' }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
            aria-label="Unteraufgabe Name"
          />
          <input
            ref={durRef}
            className="input"
            type="number"
            min={5}
            step={5}
            defaultValue={25}
            placeholder="Min"
            style={{ width: 68, fontSize: 'var(--tx-xs)' }}
            aria-label="Unteraufgabe Dauer in Minuten"
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleAddSubtask}
            aria-label="Unteraufgabe hinzufügen"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
