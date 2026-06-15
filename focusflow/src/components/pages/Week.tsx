import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { DeadlineChip } from '../ui/DeadlineChip';
import { dateKey, TAG_COLORS, DAYS } from '../../engine/utils';
import type { ScheduleSlot } from '../../types';

const DAY_START_H = 6;
const DAY_END_H = 22;
const TOTAL_HOURS = DAY_END_H - DAY_START_H;
const DAY_START_MIN = DAY_START_H * 60;
const PX_PER_MIN = 64 / 60;
const HOUR_H = 64;

const PRIO_LABELS: Record<string, string> = { high: '🔴 Hoch', med: '🟡 Mittel', low: '🟢 Niedrig' };

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function slotTop(start: string): number {
  return (timeToMin(start) - DAY_START_MIN) * PX_PER_MIN;
}

function slotHeight(dur: number): number {
  return Math.max(20, dur * PX_PER_MIN);
}

interface SlotBlockProps {
  slot: ScheduleSlot;
  tagColor: string | undefined;
}

function SlotBlock({ slot, tagColor }: SlotBlockProps) {
  const top = slotTop(slot.start);
  const height = slotHeight(slot.dur);

  let bg = 'var(--surf3)';
  if (slot.type === 'break') bg = 'rgba(120,120,120,0.12)';
  else if (slot.type === 'task' && tagColor) bg = tagColor;

  const classes = [
    'week-slot',
    slot.type === 'fixed' ? 'week-slot-fixed' : '',
    slot.type === 'break' ? 'week-slot-break' : '',
    slot.done ? 'done' : '',
    slot.missed ? 'missed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ top, height, background: bg, opacity: slot.type === 'break' ? 1 : undefined }}
      title={`${slot.label} ${slot.start}–${slot.end}`}
    >
      {height > 30 && (
        <span className="week-slot-label">{slot.label}</span>
      )}
    </div>
  );
}

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNewFixture?: (dateStr: string) => void;
}

export function Week({ state, dispatch, onNewFixture }: Props) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMin - DAY_START_MIN) * PX_PER_MIN;
  const showNowLine = nowMin >= DAY_START_MIN && nowMin <= DAY_END_H * 60;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dk = dateKey(d);
    const slots = state.schedule[dk] ?? [];
    return { d, dk, slots, isToday: i === 0 };
  });

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => DAY_START_H + i);

  const activeProjects = state.projects.filter((p) => !p.done);

  return (
    <div>
      <h1 className="pg-title">Wochenplan 📅</h1>
      <p className="pg-sub">Stundengenaue Ansicht deiner geplanten Woche</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button
          className="btn btn-pri btn-sm"
          onClick={() => dispatch({ type: 'PLAN_WEEK' })}
          aria-label="Woche neu planen"
        >
          <RefreshCw size={13} /> Neu planen
        </button>
      </div>

      <div style={{ overflow: 'hidden', borderRadius: 'var(--r-xl)', border: '1px solid var(--div)', background: 'var(--surf)' }}>
        <div className="week-cal" style={{ display: 'flex', overflowX: 'auto' }} ref={scrollRef}>
          <div className="week-time-axis">
            {hours.map((h) => (
              <div key={h} className="week-time-label">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="week-cols">
            {weekDays.map(({ d, dk, slots, isToday }) => {
              const dayName = DAYS[d.getDay()];
              const dayNum = d.getDate();

              return (
                <div key={dk} className="week-col">
                  <div className={`week-col-hdr${isToday ? ' today' : ''}`}>
                    <span className="wc-name">{dayName}</span>
                    <span className="wc-num">{dayNum}</span>
                  </div>

                  <div
                    className="week-col-body"
                    style={{ height: TOTAL_HOURS * HOUR_H }}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('.week-slot')) return;
                      onNewFixture?.(dk);
                    }}
                  >
                    {hours.map((h, i) => (
                      <div
                        key={h}
                        className="week-hour-stripe"
                        style={{ top: i * HOUR_H }}
                      />
                    ))}

                    {slots.map((slot) => {
                      const proj = slot.projectId
                        ? state.projects.find((p) => p.id === slot.projectId)
                        : undefined;
                      const tagColor = TAG_COLORS[proj?.tag ?? slot.tag ?? ''];
                      return (
                        <SlotBlock key={slot.id} slot={slot} tagColor={tagColor} />
                      );
                    })}

                    {isToday && showNowLine && (
                      <div className="week-now-line" style={{ top: nowTop }}>
                        <div className="week-now-dot" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <h2 style={{ fontSize: 'var(--tx-base)', fontWeight: 700, marginBottom: '0.5rem' }}>Zeitbudgets diese Woche</h2>
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
            const fillClass =
              pct > 100 ? 'budget-fill-over' : pct > 75 ? 'budget-fill-warn' : 'budget-fill-ok';

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
    </div>
  );
}
