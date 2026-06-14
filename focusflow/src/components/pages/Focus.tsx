import { useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';

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
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'POM_TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pom.running, dispatch]);

  // Detect when timer hits 0
  useEffect(() => {
    if (prevSecsRef.current > 0 && pom.secs === 0) {
      dispatch({ type: 'POM_FINISH_ROUND' });
      if (state.settings.sound) beep(pom.isBreak ? 440 : 880);
    }
    prevSecsRef.current = pom.secs;
  }, [pom.secs]);

  const m = Math.floor(pom.secs / 60);
  const s = pom.secs % 60;
  const pct = (pom.secs / pom.total) * 100;

  const label = pom.running
    ? pom.isBreak ? '☕ Pause' : '🎯 Fokus-Zeit'
    : pom.isBreak ? '☕ Pause' : 'Bereit';

  const sub = pom.running
    ? pom.isBreak ? 'Erhol dich gut!' : 'Konzentriert arbeiten'
    : pom.isBreak ? '5 Min Pause — du hast es verdient.' : 'Starte eine Fokus-Einheit';

  return (
    <div>
      <h1 className="pg-title">Fokus-Timer ⏱</h1>
      <p className="pg-sub">Pomodoro mit adaptiven Pausen · wissenschaftlich belegt für ADHS</p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontFamily: 'var(--mono)',
            fontWeight: 500,
            color: 'var(--pri)',
            minWidth: 110,
          }}>
            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--tx-base)', fontWeight: 600, marginBottom: '.25rem' }}>{label}</div>
            <div style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)' }}>{sub}</div>
            <div className="progress-track" style={{ marginTop: '.5rem' }}>
              <div className="progress-fill" style={{ background: 'var(--pri)', width: `${pct}%` }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button
              className="btn btn-pri"
              onClick={() => dispatch({ type: 'POM_TOGGLE' })}
              aria-label={pom.running ? 'Timer pausieren' : 'Timer starten'}
            >
              {pom.running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => dispatch({ type: 'POM_RESET' })}
              aria-label="Timer zurücksetzen"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
        <div className="card-title">
          <Flame size={16} style={{ color: 'var(--dopa)' }} /> Heutige Runden
        </div>
        <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap' }}>
          {pom.rounds === 0 ? (
            <span style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx3)' }}>Noch keine Runden</span>
          ) : (
            Array.from({ length: pom.rounds }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--pri-bg)',
                  border: '2px solid var(--pri)',
                  color: 'var(--pri)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--tx-xs)',
                  fontWeight: 700,
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
