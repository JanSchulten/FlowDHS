import { useState } from 'react';
import {
  LogIn, LogOut, CloudUpload, CloudDownload, CalendarDays,
  CalendarPlus, CalendarCheck, RefreshCw, Mail,
} from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { toSnapshot } from '../../store/reducer';
import { signInGoogle, signInEmail, signUpEmail, signOut, getGoogleToken } from '../../engine/auth';
import { pullState, pushState } from '../../engine/cloud';
import { importEvents, exportSchedule } from '../../engine/calendar';
import { Toggle } from '../ui/Toggle';
import { todayKey } from '../../engine/utils';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function AccountPanel({ state, dispatch }: Props) {
  const { user, sync, calendar } = state;
  const [busy, setBusy] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authMsg, setAuthMsg] = useState('');

  const doEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg('');
    if (!email.trim() || password.length < 6) {
      setAuthMsg('Bitte E-Mail und Passwort (mindestens 6 Zeichen) eingeben.');
      return;
    }
    setBusy('email');
    try {
      if (mode === 'signup') {
        const { needsConfirm } = await signUpEmail(email.trim(), password);
        setAuthMsg(needsConfirm ? 'Fast geschafft – bitte bestätige den Link in deiner E-Mail.' : '');
      } else {
        await signInEmail(email.trim(), password);
      }
    } catch (err) {
      setAuthMsg((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const setSync = (status: 'syncing' | 'connected' | 'error' | 'idle', message: string) =>
    dispatch({ type: 'SET_SYNC', payload: { status, message, ...(status === 'connected' ? { lastSync: Date.now() } : {}) } });

  const doPush = async () => {
    if (!user) return;
    setBusy('push'); setSync('syncing', 'Sichere…');
    try {
      await pushState(user.id, toSnapshot(state));
      setSync('connected', 'In der Cloud gesichert');
    } catch (e) { setSync('error', (e as Error).message); }
    finally { setBusy(''); }
  };

  const doPull = async () => {
    if (!user) return;
    setBusy('pull'); setSync('syncing', 'Lade aus der Cloud…');
    try {
      const snap = await pullState(user.id);
      if (snap) { dispatch({ type: 'HYDRATE', snapshot: snap }); setSync('connected', 'Aus der Cloud geladen'); }
      else setSync('connected', 'Noch nichts in der Cloud');
    } catch (e) { setSync('error', (e as Error).message); }
    finally { setBusy(''); }
  };

  const doImport = async () => {
    const token = getGoogleToken();
    if (!token) { setSync('error', 'Kein Kalender-Token – bitte neu mit Google anmelden.'); return; }
    setBusy('import'); setSync('syncing', 'Importiere Termine…');
    try {
      const drafts = await importEvents(token, 7);
      dispatch({ type: 'IMPORT_EVENTS', drafts });
      dispatch({ type: 'SET_CALENDAR', payload: { enabled: true, lastImport: Date.now() } });
      setSync('connected', `${drafts.length} Termine geprüft`);
    } catch (e) { setSync('error', (e as Error).message); }
    finally { setBusy(''); }
  };

  const doExport = async () => {
    const token = getGoogleToken();
    if (!token) { setSync('error', 'Kein Kalender-Token – bitte neu mit Google anmelden.'); return; }
    const slots = state.schedule[todayKey()] ?? [];
    setBusy('export'); setSync('syncing', 'Schreibe in den Kalender…');
    try {
      const n = await exportSchedule(token, slots, todayKey());
      dispatch({ type: 'SET_CALENDAR', payload: { enabled: true, lastExport: Date.now() } });
      setSync('connected', `${n} Blöcke in den Kalender geschrieben`);
    } catch (e) { setSync('error', (e as Error).message); }
    finally { setBusy(''); }
  };

  const statusColor =
    sync.status === 'error' ? 'var(--err)' :
    sync.status === 'connected' ? 'var(--ok)' :
    sync.status === 'syncing' ? 'var(--focus)' : 'var(--tx2)';

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-title"><CalendarDays size={16} /> Konto, Cloud &amp; Kalender</div>

      {!user ? (
        <>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', marginBottom: '1rem' }}>
            Melde dich an – deine Projekte werden dauerhaft in der Cloud (Supabase)
            gespeichert. Mit <strong>Google</strong> kannst du zusätzlich deinen
            Kalender in beide Richtungen synchronisieren.
          </p>

          <button className="btn btn-pri" onClick={() => signInGoogle().catch((e) => setAuthMsg(e.message))} aria-label="Mit Google anmelden">
            <LogIn size={15} /> Mit Google anmelden
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', margin: '1rem 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--bdr)' }} />
            <span style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)' }}>oder mit E-Mail</span>
            <span style={{ flex: 1, height: 1, background: 'var(--bdr)' }} />
          </div>

          <form onSubmit={doEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', maxWidth: 380 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="auth-email">E-Mail</label>
              <input
                id="auth-email" className="input" type="email" autoComplete="email"
                placeholder="du@beispiel.de" value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="auth-pass">Passwort</label>
              <input
                id="auth-pass" className="input" type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="mindestens 6 Zeichen" value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn-pri" type="submit" disabled={busy === 'email'} aria-label={mode === 'signin' ? 'Anmelden' : 'Registrieren'}>
              <Mail size={15} /> {busy === 'email' ? 'Moment…' : mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>

          <button
            className="btn btn-ghost btn-sm" style={{ marginTop: '.5rem' }}
            onClick={() => { setMode((m) => (m === 'signin' ? 'signup' : 'signin')); setAuthMsg(''); }}
            aria-label="Zwischen Anmelden und Registrieren wechseln"
          >
            {mode === 'signin' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Anmelden'}
          </button>

          {authMsg && (
            <div style={{ marginTop: '.6rem', fontSize: 'var(--tx-xs)', color: 'var(--err)' }}>{authMsg}</div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
            {user.avatar
              ? <img src={user.avatar} alt="" width={40} height={40} style={{ borderRadius: '50%' }} referrerPolicy="no-referrer" />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--pri-bg)', color: 'var(--pri)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{user.name.charAt(0).toUpperCase()}</div>}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--tx-sm)' }}>{user.name}</div>
              <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => signOut()} aria-label="Abmelden">
              <LogOut size={14} /> Abmelden
            </button>
          </div>

          <div style={{ fontSize: 'var(--tx-xs)', fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', margin: '.5rem 0' }}>Datenbank</div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-pri btn-sm" onClick={doPush} disabled={busy !== ''} aria-label="In Cloud sichern">
              <CloudUpload size={14} /> {busy === 'push' ? 'Sichere…' : 'In Cloud sichern'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={doPull} disabled={busy !== ''} aria-label="Aus Cloud laden">
              <CloudDownload size={14} /> Aus Cloud laden
            </button>
          </div>

          <div style={{ fontSize: 'var(--tx-xs)', fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.04em', margin: '1rem 0 .5rem' }}>Google-Kalender</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem' }}>
            <span style={{ fontSize: 'var(--tx-sm)' }}>Kalender-Sync aktiv</span>
            <Toggle checked={calendar.enabled} onChange={(v) => dispatch({ type: 'SET_CALENDAR', payload: { enabled: v } })} aria-label="Kalender-Sync" />
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={doImport} disabled={busy !== ''} aria-label="Termine importieren">
              <CalendarPlus size={14} /> {busy === 'import' ? 'Importiere…' : 'Termine importieren (7 Tage)'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={doExport} disabled={busy !== ''} aria-label="Heute in Kalender exportieren">
              <CalendarCheck size={14} /> {busy === 'export' ? 'Schreibe…' : 'Heute in Kalender'}
            </button>
          </div>
          <div className="form-hint" style={{ marginTop: '.4rem' }}>
            Import legt Termine als Projekte an · Export schreibt die heutigen Fokus-Blöcke als Kalendereinträge (erneutes Ausführen ersetzt sie).
          </div>
          {!getGoogleToken() && (
            <div className="form-hint" style={{ color: 'var(--err)' }}>
              Kalender-Sync benötigt eine Anmeldung mit Google (bei E-Mail-Login nicht verfügbar).
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '1rem', fontSize: 'var(--tx-xs)', color: statusColor }}>
        <RefreshCw size={12} />
        {sync.message || (user ? 'Bereit' : 'Nicht angemeldet')}
        {sync.lastSync ? ` · ${new Date(sync.lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ''}
      </div>
    </div>
  );
}
