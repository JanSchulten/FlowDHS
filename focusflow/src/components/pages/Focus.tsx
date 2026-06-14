import { useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { TimeRing } from '../ui/TimeRing';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

function beep(freq: number) {
  try {
    const c = new (window.AudioContext || (window as never)['webkitAudioContext'])();
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.25, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    o.start();
    o.stop(c.currentTime + 0.4);
  } catch {}
}

const DUR_OPTIONS = [15, 25, 45, 90];

export function Focus({ state, dispatch }: Props) {
  const { pom } = state;
  const intervalRef = useRef<number | null>(null);
  const prevSecsRef = useRef(pom.secs);

  useEffect(() => {
    if (pom.running) {
      intervalRef.current = window.setInterval(() => dispatch({ type: 'POM_TICK' }), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pom.running, dispatch]);

  useEffect(() => {
    if (prevSecsRef.current > 0 && pom.secs === 0) {
      dispatch({ type: 'POM_FINISH_ROUND' });
      if (state.settings.sound) beep(pom.isBreak ? 440 : 880);
    }
    prevSecsRef.current = pom.secs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pom.secs]);

  const m = Math.floor(pom.secs / 60);
  const s = pom.secs % 60;
  const timeLabel = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const progress = pom.total ? pom.secs / pom.total : 0;

  const stateLabel = pom.running
    ? pom.isBreak ? '☕ Pause läuft' : '🎯 Fokus läuft'
    : pom.isBreak ? '☕ Pause bereit' : 'Bereit';

  const activeProject = state.projects.find((p) => p.id === pom.projectId);

  return (
    <div>
      <h1 className="pg-title">Fokus-Timer ⏱</h1>
      <p className="pg-sub">Pomodoro mit adaptiven Pausen · der schrumpfende Ring macht Restzeit sichtbar (gegen Zeitblindheit).</p>

      <div className="card" style={{ display: 'grid', placeItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
        <TimeRing progress={progress} timeLabel={timeLabel} stateLabel={stateLabel} isBreak={pom.isBreak} />

        <div style={{ width: '100%', maxWidth: 360 }}>
          <label className="form-label" htmlFor="pom-project">Woran arbeitest du?</label>
          <select
            id="pom-project"
            className="input"
            value={pom.projectId ?? ''}
            onChange={(e) => dispatch({ type: 'POM_SET_PROJECT', projectId: e.target.value || null })}
          >
            <option value="">— Kein Projekt (freie Session) —</option>
            {state.projects.filter((p) => !p.done).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {activeProject && activeProject.actualMins > 0 && (
            <div className="form-hint">Bereits {Math.round((activeProject.actualMins / 60) * 10) / 10}h hier investiert.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button className="btn btn-pri" onClick={() => dispatch({ type: 'POM_TOGGLE' })} aria-label={pom.running ? 'Timer pausieren' : 'Timer starten'}>
            {pom.running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'POM_RESET' })} aria-label="Timer zurücksetzen">
            Reset
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {DUR_OPTIONS.map((d) => (
          <button
            key={d}
            className={`btn btn-sm ${pom.dur === d ? 'btn-pri' : 'btn-ghost'}`}
            onClick={() => dispatch({ type: 'POM_SET_DUR', dur: d })}
            aria-pressed={pom.dur === d}
            aria-label={`${d} Minuten Timer`}
          >
            {d} Min{pom.dur === d ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-title"><Flame size={16} style={{ color: 'var(--dopa)' }} /> Heutige Runden</div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {pom.rounds === 0 ? (
            <span style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx3)' }}>Noch keine Runden — die erste ist die schwerste. Du schaffst das.</span>
          ) : (
            Array.from({ length: pom.rounds }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--pri-bg)', border: '2px solid var(--pri)', color: 'var(--pri)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--tx-xs)', fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
