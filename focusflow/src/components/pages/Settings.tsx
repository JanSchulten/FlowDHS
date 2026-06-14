import { Clock, Coffee, Bell, RefreshCw } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { Toggle } from '../ui/Toggle';
import type { Settings as SettingsType } from '../../types';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function Settings({ state, dispatch }: Props) {
  const { settings } = state;

  const update = (partial: Partial<SettingsType>) =>
    dispatch({ type: 'UPDATE_SETTINGS', payload: partial });

  return (
    <div>
      <h1 className="pg-title">Einstellungen ⚙️</h1>
      <p className="pg-sub">Passe den Planer an deine ADHS-Bedürfnisse an</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div className="card-title"><Clock size={16} /> Arbeitszeiten</div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-start">Frühester Start</label>
            <input
              id="stg-start"
              className="input"
              type="time"
              value={settings.start}
              onChange={(e) => update({ start: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-end">Spätestes Ende</label>
            <input
              id="stg-end"
              className="input"
              type="time"
              value={settings.end}
              onChange={(e) => update({ end: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-blocks">Max. Fokus-Blöcke / Tag (ADHS-Limit)</label>
            <input
              id="stg-blocks"
              className="input"
              type="number"
              min={1}
              max={8}
              value={settings.maxBlocks}
              onChange={(e) => update({ maxBlocks: parseInt(e.target.value) || 4 })}
            />
            <div className="form-hint">Empfohlen: 3–4 Deep-Work-Blöcke à 25–45 Min</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Coffee size={16} /> Pausen</div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-break-s">Kurze Pause (nach jedem Block, Min)</label>
            <input
              id="stg-break-s"
              className="input"
              type="number"
              min={5}
              max={30}
              value={settings.breakS}
              onChange={(e) => update({ breakS: parseInt(e.target.value) || 10 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stg-break-l">Lange Pause (nach 3 Blöcken, Min)</label>
            <input
              id="stg-break-l"
              className="input"
              type="number"
              min={15}
              max={60}
              value={settings.breakL}
              onChange={(e) => update({ breakL: parseInt(e.target.value) || 30 })}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-title"><Bell size={16} /> Verhalten</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--tx-sm)' }}>Timer-Sound</span>
              <Toggle checked={settings.sound} onChange={(v) => update({ sound: v })} aria-label="Timer-Sound aktivieren" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--tx-sm)' }}>Konfetti bei Abschluss</span>
              <Toggle checked={settings.confetti} onChange={(v) => update({ confetti: v })} aria-label="Konfetti bei Abschluss aktivieren" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--tx-sm)' }}>Auto-Umplanung vorschlagen</span>
              <Toggle checked={settings.autoReschedule} onChange={(v) => update({ autoReschedule: v })} aria-label="Auto-Umplanung aktivieren" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><RefreshCw size={16} /> Reset</div>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', marginBottom: '1rem' }}>
            Tages-Streak oder alle Daten zurücksetzen. Kein Shame-Loop — morgen ist neu.
          </p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => dispatch({ type: 'PLAN_WEEK' })}
              aria-label="Woche neu planen"
            >
              Woche neu planen
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => { if (confirm('Alle Daten löschen?')) dispatch({ type: 'CLEAR_ALL' }); }}
              aria-label="Alle Daten löschen"
            >
              Alles löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
