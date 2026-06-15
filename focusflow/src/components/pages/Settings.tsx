import { Clock, Coffee, Bell, RefreshCw, Trophy } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { Toggle } from '../ui/Toggle';
import { GoogleSyncPanel } from '../sync/GoogleSyncPanel';
import { levelTitle } from '../../engine/gamification';
import type { Settings as SettingsType } from '../../types';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function Settings({ state, dispatch }: Props) {
  const { settings, game, achievements, stats } = state;
  const update = (partial: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', payload: partial });
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div>
      <h1 className="pg-title">Einstellungen ⚙️</h1>
      <p className="pg-sub">Passe den Planer an deine ADHS-Bedürfnisse an. Alles ist optional — weniger ist oft mehr.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        <GoogleSyncPanel state={state} dispatch={dispatch} />

        {/* Fortschritt / Gamification */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-title"><Trophy size={16} style={{ color: 'var(--dopa)' }} /> Dein Fortschritt</div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
            <div><div className="stat-val">Lv {game.level}</div><div className="stat-label">{levelTitle(game.level)}</div></div>
            <div><div className="stat-val">{game.xp}</div><div className="stat-label">XP gesamt</div></div>
            <div><div className="stat-val">{stats.pomodoros}</div><div className="stat-label">Pomodoros</div></div>
            <div><div className="stat-val">{Math.round((stats.focusMins / 60) * 10) / 10}h</div><div className="stat-label">fokussiert</div></div>
            <div><div className="stat-val">{unlocked}/{achievements.length}</div><div className="stat-label">Erfolge</div></div>
          </div>
          <div className="ach-grid">
            {achievements.map((a) => (
              <div key={a.id} className={`ach-card ${a.unlockedAt ? '' : 'locked'}`} title={a.unlockedAt ? 'Freigeschaltet' : 'Noch gesperrt'}>
                <div className="ach-icon">{a.icon}</div>
                <div className="ach-name">{a.name}</div>
                <div className="ach-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Clock size={16} /> Arbeitszeiten</div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-start">Frühester Start</label>
            <input id="stg-start" className="input" type="time" value={settings.start} onChange={(e) => update({ start: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-end">Spätestes Ende</label>
            <input id="stg-end" className="input" type="time" value={settings.end} onChange={(e) => update({ end: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-blocks">Max. Fokus-Blöcke / Tag (ADHS-Limit)</label>
            <input id="stg-blocks" className="input" type="number" min={1} max={8} value={settings.maxBlocks} onChange={(e) => update({ maxBlocks: parseInt(e.target.value) || 4 })} />
            <div className="form-hint">Empfohlen: 3–4 Deep-Work-Blöcke à 25–45 Min</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Coffee size={16} /> Pausen</div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-break-s">Kurze Pause (nach jedem Block, Min)</label>
            <input id="stg-break-s" className="input" type="number" min={5} max={30} value={settings.breakS} onChange={(e) => update({ breakS: parseInt(e.target.value) || 10 })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-break-l">Lange Pause (nach 3 Blöcken, Min)</label>
            <input id="stg-break-l" className="input" type="number" min={15} max={60} value={settings.breakL} onChange={(e) => update({ breakL: parseInt(e.target.value) || 30 })} />
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Bell size={16} /> Verhalten & Reize</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--tx-sm)' }}>Timer-Sound</span>
              <Toggle checked={settings.sound} onChange={(v) => update({ sound: v })} aria-label="Timer-Sound" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--tx-sm)' }}>Konfetti bei Abschluss</span>
              <Toggle checked={settings.confetti} onChange={(v) => update({ confetti: v })} aria-label="Konfetti" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--tx-sm)' }}>Auto-Umplanung vorschlagen</span>
              <Toggle checked={settings.autoReschedule} onChange={(v) => update({ autoReschedule: v })} aria-label="Auto-Umplanung" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--tx-sm)' }}>🧘 Ruhe-Modus (weniger Reize)</span>
              <Toggle checked={settings.calmMode} onChange={(v) => update({ calmMode: v })} aria-label="Ruhe-Modus" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><RefreshCw size={16} /> Reset</div>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', marginBottom: '1rem' }}>
            Woche neu planen oder alle Daten zurücksetzen. Kein Shame-Loop — morgen ist neu.
          </p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'PLAN_WEEK' })} aria-label="Woche neu planen">
              Woche neu planen
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Alle Daten löschen?')) dispatch({ type: 'CLEAR_ALL' }); }} aria-label="Alle Daten löschen">
              Alles löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
