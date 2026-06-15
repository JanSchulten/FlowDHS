import { useCallback, useEffect, useRef } from 'react';

export function useNotifications(enabled: boolean) {
  const granted = useRef(Notification.permission === 'granted');

  const request = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') { granted.current = true; return true; }
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    granted.current = result === 'granted';
    return granted.current;
  }, []);

  const notify = useCallback((title: string, body: string, icon = '/favicon.svg') => {
    if (!enabled || !granted.current) return;
    if (!('Notification' in window)) return;
    try {
      new Notification(title, { body, icon, badge: '/favicon.svg' });
    } catch {
      // Silently ignore — e.g. permission revoked between checks.
    }
  }, [enabled]);

  return { request, notify };
}

export function usePomNotification(
  pomRunning: boolean,
  pomSecs: number,
  pomIsBreak: boolean,
  notify: (title: string, body: string) => void,
) {
  const prevSecs = useRef(pomSecs);
  const prevRunning = useRef(pomRunning);

  useEffect(() => {
    if (prevRunning.current && pomRunning && prevSecs.current > 0 && pomSecs === 0) {
      if (pomIsBreak) {
        notify('FlowDHS – Pause vorbei! ☕', 'Bereit für die nächste Fokusrunde?');
      } else {
        notify('FlowDHS – Fokusrunde fertig! 🎉', 'Leg jetzt eine kurze Pause ein.');
      }
    }
    prevSecs.current = pomSecs;
    prevRunning.current = pomRunning;
  }, [pomSecs, pomRunning, pomIsBreak, notify]);
}
