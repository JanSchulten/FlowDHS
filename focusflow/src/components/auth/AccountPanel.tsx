import { useState } from 'react';
import {
  LogOut, CloudUpload, CloudDownload, Mail, RefreshCw,
} from 'lucide-react';
import type { AppState, Action } from '../../store/useStore';
import { toSnapshot } from '../../store/reducer';
import { signInEmail, signUpEmail, signOut } from '../../engine/auth';
import { pullState, pushState } from '../../engine/cloud';

interface Props {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export function AccountPanel({ state, dispatch }: Props) {
  const { user, sync } = state;
  const [busy, setBusy] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authMsg, setAuthMsg] = useState('');

  const setSync = (status: 'syncing' | 'connected' | 'error' | 'idle', message: string) =>
    dispatch({ type: 'SET_SYNC', payload: { status, message, ...(status === 'connected' ? { lastSync: Date.now() } : {}) } });

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

  const statusColor =
    sync.status === 'error' ? 'var(--err)' :
    sync.status === 'connected' ? 'var(--ok)' :
    sync.status === 'syncing' ? 'var(--focus)' : 'var(--tx2)';

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-title"><CloudUpload size={16} /> Konto &amp; Cloud-Speicher</div>

      {!user ? (
        <>
          <p style={{ fontSize: 'var(--tx-sm)', color: 'var(--tx2)', marginBottom: '1rem' }}>
            Melde dich mit E-Mail an – deine Projekte werden dauerhaft und
            geräteübergreifend in der Cloud (Supabase) gespeichert.
          </p>

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
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--pri-bg)', color: 'var(--pri)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--tx-sm)' }}>{user.name}</div>
              <div style={{ fontSize: 'var(--tx-xs)', color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => signOut()} aria-label="Abmelden">
              <LogOut size={14} /> Abmelden
            </button>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-pri btn-sm" onClick={doPush} disabled={busy !== ''} aria-label="In Cloud sichern">
              <CloudUpload size={14} /> {busy === 'push' ? 'Sichere…' : 'In Cloud sichern'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={doPull} disabled={busy !== ''} aria-label="Aus Cloud laden">
              <CloudDownload size={14} /> Aus Cloud laden
            </button>
          </div>
          <div className="form-hint" style={{ marginTop: '.4rem' }}>
            Änderungen werden automatisch gesichert. Manuell geht es jederzeit über die Buttons.
          </div>
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
