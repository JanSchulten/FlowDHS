import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import type { Project, BoardStatus } from '../../types';
import { BoardCard } from './BoardCard';
import { ProjectModal } from '../projects/ProjectModal';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const COLUMNS: { key: BoardStatus; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'var(--tx2)' },
  { key: 'today', label: 'Heute', color: 'var(--focus)' },
  { key: 'doing', label: 'In Arbeit', color: 'var(--dopa)' },
  { key: 'done', label: 'Erledigt', color: 'var(--ok)' },
];

export function Board({ state, dispatch }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<BoardStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const byStatus = (s: BoardStatus) => state.projects.filter((p) => p.status === s);

  const drop = (status: BoardStatus) => {
    if (dragId) dispatch({ type: 'SET_PROJECT_STATUS', id: dragId, status });
    setDragId(null);
    setOverCol(null);
  };

  const handleSave = (data: Omit<Project, 'id' | 'createdAt'>) => {
    if (editProject) dispatch({ type: 'UPDATE_PROJECT', payload: { ...editProject, ...data } });
    else dispatch({ type: 'ADD_PROJECT', payload: data });
    setModalOpen(false);
    setEditProject(null);
  };

  return (
    <div>
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Board 🗂️</h1>
          <p className="pg-sub">Ziehe Projekte zwischen den Spalten — sichtbarer Fortschritt erzeugt Dopamin.</p>
        </div>
        <button className="btn btn-pri" onClick={() => { setEditProject(null); setModalOpen(true); }}>
          <Plus size={15} /> Neues Projekt
        </button>
      </div>

      <div className="board">
        {COLUMNS.map((col) => {
          const items = byStatus(col.key);
          return (
            <div
              key={col.key}
              className={`board-col ${overCol === col.key ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={() => drop(col.key)}
            >
              <div className="board-col-head">
                <span className="board-col-dot" style={{ background: col.color }} />
                {col.label}
                <span className="board-col-count">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <div className="board-empty">Hierher ziehen</div>
              ) : (
                items.map((p) => (
                  <BoardCard
                    key={p.id}
                    project={p}
                    dragging={dragId === p.id}
                    onDragStart={setDragId}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onOpen={(proj) => { setEditProject(proj); setModalOpen(true); }}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      <ProjectModal
        open={modalOpen}
        editProject={editProject}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
