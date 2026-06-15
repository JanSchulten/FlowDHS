import { useState } from 'react';
import { Clock, Coffee, Bell, RefreshCw, Trophy, Tag, Plus, X, Pencil } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { Toggle } from '../ui/Toggle';
import { AccountPanel } from '../auth/AccountPanel';
import { levelTitle } from '../../engine/gamification';
import type { Settings as SettingsType, CustomCategory } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const PALETTE = [
  { color: '#a78bfa', bgColor: '#1e1b4b' },
  { color: '#34d399', bgColor: '#064e3b' },
  { color: '#f472b6', bgColor: '#500724' },
  { color: '#fb923c', bgColor: '#431407' },
  { color: '#60a5fa', bgColor: '#1e3a5f' },
  { color: '#fbbf24', bgColor: '#451a03' },
  { color: '#f87171', bgColor: '#450a0a' },
  { color: '#a3e635', bgColor: '#1a2e05' },
];

const EMPTY_CAT = { name: '', color: PALETTE[0].color, bgColor: PALETTE[0].bgColor };

export function Settings({ state, dispatch }: Props) {
  const { settings, game, achievements, stats } = state;
  const update = (partial: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', payload: partial });
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  const { request } = useNotifications(settings.notifications ?? false);

  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const saveCategory = () => {
    if (!catForm.name.trim()) return;
    if (editCatId) {
      dispatch({ type: 'UPDATE_CATEGORY', payload: { ...catForm, id: editCatId, name: catForm.name.trim() } });
      setEditCatId(null);
    } else {
      dispatch({ type: 'ADD_CATEGORY', payload: { ...catForm, name: catForm.name.trim() } });
    }
    setCatForm(EMPTY_CAT);
  };

  const editCategory = (c: CustomCategory) => {
    setCatForm({ name: c.name, color: c.color, bgColor: c.bgColor });
    setEditCatId(c.id);
  };

  const handleNotifToggle = async (v: boolean) => {
    if (v) {
      const ok = await request();
      if (ok) update({ notifications: true });
    } else {
      update({ notifications: false });
    }
  };

  return (
    <div>
      <h1 className="pg-title">Einstellungen ⚙️</h1>
      <p className="pg-sub">Passe den Planer an deine ADHS-Bedürfnisse an. Alles ist optional — weniger ist oft mehr.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        <AccountPanel state={state} dispatch={dispatch} />

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 'var(--tx-sm)' }}>🔔 Browser-Benachrichtigungen</span>
                <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)' }}>Pomodoro-Ende, Aufgaben-Erinnerungen</div>
              </div>
              <Toggle
                checked={settings.notifications ?? false}
                onChange={handleNotifToggle}
                aria-label="Benachrichtigungen"
              />
            </div>
          </div>
        </div>

        {/* Custom Categories */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-title"><Tag size={16} /> Eigene Kategorien</div>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', marginBottom: '1rem' }}>
            Erstelle eigene Projekttypen neben den eingebauten (Deep Work, Kreativ, usw.).
          </p>

          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
              <label className="form-label">Name</label>
              <input
                className="input"
                placeholder="z. B. Haushalt, Studium…"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && saveCategory()}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Farbe</label>
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                {PALETTE.map((p) => (
                  <button
                    key={p.color}
                    onClick={() => setCatForm({ ...catForm, color: p.color, bgColor: p.bgColor })}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', background: p.color,
                      border: catForm.color === p.color ? '2px solid var(--tx)' : '2px solid transparent',
                    }}
                    aria-label={`Farbe ${p.color}`}
                  />
                ))}
              </div>
            </div>
            <button className="btn btn-pri btn-sm" onClick={saveCategory}>
              <Plus size={13} /> {editCatId ? 'Speichern' : 'Hinzufügen'}
            </button>
            {editCatId && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditCatId(null); setCatForm(EMPTY_CAT); }}>
                <X size={13} /> Abbrechen
              </button>
            )}
          </div>

          {(settings.customCategories ?? []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {(settings.customCategories ?? []).map((c) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem',
                  padding: '.4rem .6rem', background: 'var(--surf2)',
                  border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)',
                }}>
                  <span style={{
                    padding: '1px .55rem', borderRadius: 'var(--r-full)',
                    background: c.bgColor, color: c.color,
                    fontSize: 'var(--tx-xs)', fontWeight: 600, flexShrink: 0,
                  }}>{c.name}</span>
                  <span style={{ flex: 1, fontSize: 'var(--tx-xs)', color: 'var(--tx3)' }}>{c.color}</span>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => editCategory(c)} aria-label="Bearbeiten">
                    <Pencil size={12} />
                  </button>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => dispatch({ type: 'DELETE_CATEGORY', id: c.id })} aria-label="Löschen">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
