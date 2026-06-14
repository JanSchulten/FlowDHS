import { RefreshCw, Clock } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { DeadlineChip } from '../ui/DeadlineChip';
import { dateKey, isUrgent, TAG_COLORS, DAYS } from '../../engine/utils';

const PRIO_LABELS: Record<string, string> = { high: '🔴 Hoch', med: '🟡 Mittel', low: '🟢 Niedrig' };

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function Week({ state, dispatch }: Props) {
  const now = new Date();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dk = dateKey(d);
    const slots = (state.schedule[dk] ?? []).filter((s) => s.type === 'task');
    const done = slots.filter((s) => s.done).length;
    return { d, dk, slots, done, isToday: i === 0 };
  });

  const totalPlanned = weekDays.reduce((a, x) => a + x.slots.length, 0);
  const totalDone = weekDays.reduce((a, x) => a + x.done, 0);
  const openProjects = state.projects.filter((p) => !p.done).length;
  const urgentCount = state.projects.filter((p) => !p.done && isUrgent(p.deadline)).length;

  const activeProjects = state.projects.filter((p) => !p.done);

  return (
    <div>
      <h1 className="pg-title">Wochenplan 📅</h1>
      <p className="pg-sub">KI plant Aufgaben in deine verfügbare Zeit — mit Deadlines, Wochenbudget & Pausen</p>

      <div className="week-grid">
        {weekDays.map(({ d, dk, slots, done, isToday }) => (
          <div key={dk} className={`week-day ${isToday ? 'today' : ''}`}>
            <div className="week-day-name">{DAYS[d.getDay()]}</div>
            <div className="week-day-num">{d.getDate()}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {slots.map((s) => {
                const proj = state.projects.find((p) => p.id === s.projectId);
                const color = TAG_COLORS[proj?.tag ?? 'focus'];
                return <span key={s.id} className="week-dot" style={{ background: color }} />;
              })}
            </div>
            {slots.length > 0 && (
              <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 3 }}>
                {done}/{slots.length}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 700 }}>Zeitbudgets diese Woche</h2>
        <button
          className="btn btn-pri btn-sm"
          onClick={() => dispatch({ type: 'PLAN_WEEK' })}
          aria-label="Woche neu planen"
        >
          <RefreshCw size={13} /> Neu planen
        </button>
      </div>

      <div>
        {activeProjects.length === 0 ? (
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx3)' }}>Alle Projekte erledigt.</p>
        ) : (
          activeProjects.map((p) => {
            const budget = (p.weekBudgetH ?? 2) * 60;
            let planned = 0;
            weekDays.forEach(({ dk }) => {
              planned += (state.schedule[dk] ?? [])
                .filter((s) => s.type === 'task' && s.projectId === p.id)
                .reduce((a, b) => a + b.dur, 0);
            });
            const pct = Math.min(100, Math.round((planned / budget) * 100));
            const fillClass = pct > 100 ? 'budget-fill-over' : pct > 75 ? 'budget-fill-warn' : 'budget-fill-ok';

            return (
              <div key={p.id} className="budget-bar">
                <div className="budget-meta">
                  <span className="budget-label">
                    {p.name}{' '}
                    <span className={`prio prio-${p.priority}`}>{PRIO_LABELS[p.priority]}</span>{' '}
                    {p.deadline && <DeadlineChip deadline={p.deadline} done={p.done} />}
                  </span>
                  <span className="budget-nums">
                    {Math.round((planned / 60) * 10) / 10}h / {p.weekBudgetH ?? 2}h
                  </span>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-xl)', padding: '1rem', marginTop: '1rem' }}>
        <div className="card-title">
          <Clock size={16} /> Wochenübersicht
        </div>
        <div style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)' }}>
          {totalPlanned} Blöcke geplant · {totalDone} erledigt · {openProjects} offene Projekte
          {urgentCount > 0 && (
            <span style={{ color: 'var(--err)' }}> · {urgentCount} dringend ⚠</span>
          )}
        </div>
      </div>
    </div>
  );
}
