import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import type { Project } from '../../types';
import { ProjectCard } from '../projects/ProjectCard';
import { ProjectModal } from '../projects/ProjectModal';
import { isUrgent } from '../../engine/utils';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

type Filter = 'all' | 'active' | 'urgent' | 'done';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'active', label: 'Aktiv' },
  { key: 'urgent', label: 'Dringend 🔴' },
  { key: 'done', label: 'Erledigt ✅' },
];

export function Projects({ state, dispatch }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const { projectFilter } = state;

  let list = [...state.projects];
  if (projectFilter === 'active') list = list.filter((p) => !p.done);
  if (projectFilter === 'urgent') list = list.filter((p) => !p.done && isUrgent(p.deadline));
  if (projectFilter === 'done') list = list.filter((p) => p.done);

  list.sort((a, b) => {
    const pv: Record<string, number> = { high: 0, med: 1, low: 2 };
    if (!a.done && b.done) return -1;
    if (a.done && !b.done) return 1;
    return (pv[a.priority] ?? 1) - (pv[b.priority] ?? 1);
  });

  const openModal = (project?: Project) => {
    setEditProject(project ?? null);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<Project, 'id' | 'createdAt'>) => {
    if (editProject) {
      dispatch({ type: 'UPDATE_PROJECT', payload: { ...editProject, ...data } });
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: data });
    }
    setModalOpen(false);
    setEditProject(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="pg-title" style={{ marginBottom: '.25rem' }}>Projekte & Aufgaben</h1>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)' }}>Mit Deadlines, Wochenbudget & Unteraufgaben</p>
        </div>
        <button className="btn btn-pri" onClick={() => openModal()} aria-label="Neues Projekt erstellen">
          <Plus size={15} /> Neues Projekt
        </button>
      </div>

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm ${projectFilter === f.key ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => dispatch({ type: 'SET_FILTER', filter: f.key })}
            aria-pressed={projectFilter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <h3>Keine Projekte</h3>
          <p>Erstelle dein erstes Projekt mit Deadline und Wochenbudget.</p>
        </div>
      ) : (
        list.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onComplete={(id) => dispatch({ type: 'COMPLETE_PROJECT', id })}
            onEdit={(p) => openModal(p)}
            onDelete={(id) => dispatch({ type: 'DELETE_PROJECT', id })}
            onToggleSubtask={(pid, sid) => dispatch({ type: 'TOGGLE_SUBTASK', projectId: pid, subtaskId: sid })}
            onDeleteSubtask={(pid, sid) => dispatch({ type: 'DELETE_SUBTASK', projectId: pid, subtaskId: sid })}
            onAddSubtask={(pid, name, dur) => dispatch({ type: 'ADD_SUBTASK', projectId: pid, subtask: { name, dur, done: false } })}
            onAddSubtasksBulk={(pid, subtasks) => dispatch({ type: 'ADD_SUBTASKS_BULK', projectId: pid, subtasks })}
            onFocus={(pid) => { dispatch({ type: 'POM_SET_PROJECT', projectId: pid }); dispatch({ type: 'SET_PAGE', page: 'focus' }); }}
          />
        ))
      )}

      <ProjectModal
        open={modalOpen}
        editProject={editProject}
        containers={state.fixtures.filter((f) => f.kind === 'container')}
        customCategories={state.settings.customCategories ?? []}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
