import { useEffect, useState } from 'react';
import { Sun, RefreshCw, Play } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import type { ScheduleSlot } from '../../types';
import { todayKey } from '../../engine/utils';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

function nowHHMM(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

function SlotBlock({ slot, isNow, onToggle, onReschedule }: {
  slot: ScheduleSlot;
  isNow: boolean;
  onToggle: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  if (slot.type === 'break') {
    return (
      <div className="schedule-slot">
        <div className="slot-time">{slot.start}</div>
        <div className="slot-block slot-break">{slot.label} · {slot.dur} Min</div>
      </div>
    );
  }

  if (slot.type === 'fixed') {
    const locked = slot.locked;
    return (
      <div className="schedule-slot">
        <div className="slot-time">{slot.start}</div>
        <div className={`slot-block slot-fixed ${locked ? 'slot-fixed-lock' : ''}`}>
          <span style={{ fontSize: 'var(--tx-sm)', fontWeight: 700 }}>
            {locked ? '🔒' : '🪟'} {slot.label}
          </span>
          <span className={`tag tag-${slot.tag ?? 'admin'}`} style={{ fontSize: 9 }}>
            {slot.start}–{slot.end}
          </span>
          <span style={{ fontSize: 'var(--tx-2xs, 10px)', color: 'var(--tx3)' }}>
            {locked ? 'geblockt' : 'Fenster für Projekte'}
          </span>
        </div>
      </div>
    );
  }

  const isMissed = slot.missed && !slot.done;

  return (
    <div className="schedule-slot">
      <div className="slot-time">{slot.start}</div>
      <div className={`slot-block ${isMissed ? 'slot-missed' : 'slot-task'} ${isNow ? 'slot-now' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
          <label className="toggle" style={{ width: 28, height: 16, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={slot.done}
              onChange={() => onToggle(slot.id)}
              aria-label={`Aufgabe ${slot.done ? 'erledigt' : 'abhaken'}: ${slot.label}`}
            />
            <div className="toggle-track" />
          </label>
          <span style={{
            fontSize: 'var(--tx-sm)',
            fontWeight: slot.done ? 400 : 600,
            textDecoration: slot.done ? 'line-through' : 'none',
            color: slot.done ? 'var(--tx3)' : 'inherit',
          }}>
            {slot.label}
          </span>
          <span className={`tag tag-${slot.tag ?? 'focus'}`} style={{ fontSize: 9 }}>{slot.dur} Min</span>
          {isNow && <span className="tag tag-creative" style={{ fontSize: 9 }}>● JETZT</span>}
        </div>
        {isMissed && (
          <div className="slot-missed-label">
            ⚠ Nicht erledigt
            <button className="reschedule-btn" onClick={() => onReschedule(slot.id)} aria-label="Aufgabe umplanen">
              <RefreshCw size={10} /> Umplanen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Today({ state, dispatch }: Props) {
  const key = todayKey();
  const slots = state.schedule[key] ?? [];
  const [now, setNow] = useState(nowHHMM());

  useEffect(() => {
    if (slots.length === 0) dispatch({ type: 'PLAN_TODAY' });
    dispatch({ type: 'CHECK_MISSED' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setNow(nowHHMM()), 30000);
    return () => clearInterval(iv);
  }, []);

  const taskSlots = slots.filter((s) => s.type === 'task');
  const done = taskSlots.filter((s) => s.done).length;
  const open = taskSlots.filter((s) => !s.done && !s.missed).length;
  const mins = taskSlots.filter((s) => s.done).reduce((a, b) => a + b.dur, 0);
  const missedCount = taskSlots.filter((s) => s.missed && !s.done).length;

  // Time-blindness: what is happening *now* and what's *next*.
  const nowSlot = slots.find((s) => s.type === 'task' && !s.done && s.start <= now && now < s.end);
  const nextSlot = slots.find((s) => s.type === 'task' && !s.done && s.start > now)
    ?? taskSlots.find((s) => !s.done && s !== nowSlot);

  return (
    <div>
      <h1 className="pg-title">Dein Tag 🧠</h1>
      <p className="pg-sub">Adaptiv geplant · Pausen integriert · Unerledigtes wird automatisch umgeplant</p>

      {missedCount > 0 && state.settings.autoReschedule && (
        <div className="reschedule-banner" role="alert">
          <div className="banner-icon">🔄</div>
          <div>
            <h3>Umplanung verfügbar</h3>
            <p>{missedCount} Aufgabe(n) nicht erledigt. Kein Stress — wir verteilen sie auf die nächsten Tage.</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'AUTO_RESCHEDULE' })} aria-label="Automatisch umplanen">
              Jetzt umplanen
            </button>
          </div>
        </div>
      )}

      {taskSlots.length > 0 && (
        <div className="nownext">
          <div className="nownext-card now">
            <div className="nownext-kicker">▶ Jetzt</div>
            {nowSlot ? (
              <>
                <div className="nownext-task">{nowSlot.label}</div>
                <div className="nownext-time">{nowSlot.start}–{nowSlot.end} · {nowSlot.dur} Min</div>
              </>
            ) : (
              <div className="nownext-empty">Gerade kein Block aktiv — gönn dir oder starte den nächsten.</div>
            )}
          </div>
          <div className="nownext-card">
            <div className="nownext-kicker">⏭ Als Nächstes</div>
            {nextSlot ? (
              <>
                <div className="nownext-task">{nextSlot.label}</div>
                <div className="nownext-time">
                  ab {nextSlot.start} · {nextSlot.dur} Min
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: '.5rem' }}
                    onClick={() => {
                      if (nextSlot.projectId) dispatch({ type: 'POM_SET_PROJECT', projectId: nextSlot.projectId });
                      dispatch({ type: 'SET_PAGE', page: 'focus' });
                    }}
                    aria-label="Fokus-Timer für nächste Aufgabe starten"
                  >
                    <Play size={11} /> Fokus
                  </button>
                </div>
              </>
            ) : (
              <div className="nownext-empty">Alles geschafft für heute 🎉</div>
            )}
          </div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-val">{done}</div><div className="stat-label">Erledigt heute</div></div>
        <div className="stat-card"><div className="stat-val">{mins}</div><div className="stat-label">Min. fokussiert</div></div>
        <div className="stat-card"><div className="stat-val">{open}</div><div className="stat-label">Noch offen</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: 'var(--dopa)' }}>{state.streak}🔥</div><div className="stat-label">Tages-Streak</div></div>
      </div>

      {slots.length === 0 ? (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14l2 2 4-4"/></svg>
          <h3>Keine Aufgaben geplant</h3>
          <p>Erstelle Projekte — der Planer baut deinen Tag automatisch auf.</p>
          <button className="btn btn-pri" style={{ margin: '0 auto' }} onClick={() => dispatch({ type: 'SET_PAGE', page: 'projects' })}>
            Projekte öffnen
          </button>
        </div>
      ) : (
        <div className="schedule-day">
          <div className="schedule-day-header today"><Sun size={14} /> Heute</div>
          {slots.map((slot) => (
            <SlotBlock
              key={slot.id}
              slot={slot}
              isNow={slot.id === nowSlot?.id}
              onToggle={(id) => dispatch({ type: 'TOGGLE_SLOT', slotId: id })}
              onReschedule={(id) => dispatch({ type: 'RESCHEDULE_SLOT', slotId: id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
