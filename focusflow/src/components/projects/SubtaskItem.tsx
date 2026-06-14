import { X, Check } from 'lucide-react';
import type { Subtask } from '../../types';

interface Props {
  projectId: string;
  subtask: Subtask;
  onToggle: (pid: string, sid: string) => void;
  onDelete: (pid: string, sid: string) => void;
}

export function SubtaskItem({ projectId, subtask, onToggle, onDelete }: Props) {
  return (
    <div className={`subtask-item ${subtask.done ? 'done' : ''}`}>
      <div
        className="subtask-check"
        onClick={() => onToggle(projectId, subtask.id)}
        role="checkbox"
        aria-checked={subtask.done}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle(projectId, subtask.id)}
        aria-label={`Subtask ${subtask.done ? 'erledigt' : 'offen'}: ${subtask.name}`}
      >
        {subtask.done && <Check size={10} strokeWidth={3} />}
      </div>
      <span className="subtask-label">{subtask.name}</span>
      <span className="subtask-dur">{subtask.dur} Min</span>
      <button
        className="icon-btn"
        style={{ width: 20, height: 20 }}
        onClick={() => onDelete(projectId, subtask.id)}
        aria-label={`Subtask löschen: ${subtask.name}`}
      >
        <X size={11} />
      </button>
    </div>
  );
}
