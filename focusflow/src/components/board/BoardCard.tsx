import type { Project } from '../../types';
import { DeadlineChip } from '../ui/DeadlineChip';
import { tagLabel, TAG_COLORS } from '../../engine/utils';

interface Props {
  project: Project;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onOpen: (p: Project) => void;
  dragging: boolean;
}

export function BoardCard({ project, onDragStart, onDragEnd, onOpen, dragging }: Props) {
  const subs = project.subtasks ?? [];
  const done = subs.filter((s) => s.done).length;
  const pct = subs.length ? Math.round((done / subs.length) * 100) : project.done ? 100 : 0;

  return (
    <div
      className={`board-card ${dragging ? 'dragging' : ''}`}
      style={{ borderLeftColor: TAG_COLORS[project.tag] }}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(project.id); }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(project)}
      aria-label={`Projekt ${project.name}, Status ${project.status}`}
    >
      <div className="board-card-title">{project.name}</div>
      <div className="board-card-meta">
        <span className={`tag tag-${project.tag}`}>{tagLabel(project.tag)}</span>
        {project.deadline && <DeadlineChip deadline={project.deadline} done={project.done} />}
      </div>
      <div className="board-card-foot">
        {subs.length > 0 && (
          <>
            <div className="board-mini-track"><div className="board-mini-fill" style={{ width: `${pct}%` }} /></div>
            <span>{done}/{subs.length}</span>
          </>
        )}
        {project.actualMins > 0 && <span>· {Math.round((project.actualMins / 60) * 10) / 10}h fokussiert</span>}
      </div>
    </div>
  );
}
