import { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, ChevronDown, ExternalLink } from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { Toggle } from '../ui/Toggle';
import { pushProjects, pullProjects, parseSheetId } from '../../engine/sheets';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function GoogleSyncPanel({ state, dispatch }: Props) {
  const { google, sync } = state;
  const [showGuide, setShowGuide] = useState(false);
  const ready = google.clientId.trim() !== '' && parseSheetId(google.sheetUrl) !== null;

  const setCfg = (patch: Partial<typeof google>) =>
    dispatch({ type: 'SET_GOOGLE_CONFIG', payload: patch });

  const doPush = async () => {
    dispatch({ type: 'SET_SYNC', payload: { status: 'syncing', message: 'Lade hoch…' } });
    try {
      await pushProjects(google.clientId, google.sheetUrl, state.projects);
      dispatch({ type: 'SET_SYNC', payload: { status: 'connected', message: 'Hochgeladen', lastSync: Date.now() } });
    } catch (e) {
      dispatch({ type: 'SET_SYNC', payload: { status: 'error', message: (e as Error).message } });
    }
  };

  const doPull = async () => {
    dispatch({ type: 'SET_SYNC', payload: { status: 'syncing', message: 'Lade herunter…' } });
    try {
      const projects = await pullProjects(google.clientId, google.sheetUrl);
      dispatch({ type: 'REPLACE_PROJECTS', projects });
      dispatch({ type: 'SET_SYNC', payload: { status: 'connected', message: `${projects.length} Projekte geladen`, lastSync: Date.now() } });
    } catch (e) {
      dispatch({ type: 'SET_SYNC', payload: { status: 'error', message: (e as Error).message } });
    }
  };

  const statusColor =
    sync.status === 'error' ? 'var(--err)' :
    sync.status === 'connected' ? 'var(--ok)' :
    sync.status === 'syncing' ? 'var(--focus)' : 'var(--tx2)';

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-title"><Cloud size={16} /> Google-Sheets-Sync (Datenbank)</div>
      <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', marginBottom: '1rem' }}>
        Speichere alle Projekte in deiner eigenen Google-Tabelle. Über Google-Anmeldung (OAuth)
        liest und schreibt FocusFlow direkt in dein Sheet — wie eine kleine Datenbank.
      </p>

      <div className="input-row">
        <div className="form-group">
          <label className="form-label" htmlFor="g-client">OAuth-Client-ID</label>
          <input
            id="g-client"
            className="input"
            placeholder="1234-abc.apps.googleusercontent.com"
            value={google.clientId}
            onChange={(e) => setCfg({ clientId: e.target.value })}
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="g-sheet">Google-Sheet-Link</label>
          <input
            id="g-sheet"
            className="input"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={google.sheetUrl}
            onChange={(e) => setCfg({ sheetUrl: e.target.value })}
            autoComplete="off"
          />
          {google.sheetUrl && !parseSheetId(google.sheetUrl) && (
            <div className="form-hint" style={{ color: 'var(--err)' }}>Kein gültiger Sheet-Link erkannt.</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '.25rem 0 1rem' }}>
        <span style={{ fontSize: 'var(--tx-sm)' }}>Automatisch hochladen bei Änderungen</span>
        <Toggle checked={google.autoPush} onChange={(v) => setCfg({ autoPush: v })} aria-label="Auto-Upload aktivieren" />
      </div>

      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-pri" onClick={doPush} disabled={!ready || sync.status === 'syncing'} aria-label="Ins Sheet hochladen">
          <CloudUpload size={15} /> Hochladen
        </button>
        <button className="btn btn-ghost" onClick={doPull} disabled={!ready || sync.status === 'syncing'} aria-label="Vom Sheet laden">
          <CloudDownload size={15} /> Vom Sheet laden
        </button>
        <span style={{ fontSize: 'var(--tx-xs)', color: statusColor, marginLeft: '.25rem' }}>
          {sync.message || (ready ? 'Bereit' : 'Client-ID & Link eingeben')}
          {sync.lastSync ? ` · ${new Date(sync.lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
      </div>

      <button
        className="btn btn-ghost btn-sm"
        style={{ marginTop: '1rem' }}
        onClick={() => setShowGuide((v) => !v)}
        aria-expanded={showGuide}
      >
        <ChevronDown size={13} style={{ transform: showGuide ? 'rotate(180deg)' : 'none', transition: 'transform var(--ease)' }} />
        Einrichtung in 4 Schritten
      </button>

      {showGuide && (
        <ol style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', marginTop: '.75rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <li>
            Öffne die <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">Google Cloud Console <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /></a> und erstelle ein Projekt.
          </li>
          <li>Aktiviere die <strong>Google Sheets API</strong> und erstelle eine <strong>OAuth-Client-ID</strong> (Typ „Webanwendung“). Trage diese URL unter „Autorisierte JavaScript-Quellen“ ein.</li>
          <li>Kopiere die Client-ID oben hinein. Lege ein leeres Google Sheet an und füge dessen Link ein.</li>
          <li>Klick „Hochladen“ → melde dich mit Google an. FocusFlow legt die Tabs <code>Projects</code> &amp; <code>Subtasks</code> an und speichert alles dort.</li>
        </ol>
      )}
    </div>
  );
}
