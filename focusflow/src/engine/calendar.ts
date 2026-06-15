import type { Project, ScheduleSlot } from '../types';

// Two-way Google Calendar sync using the user's Google access token
// (provider_token from the Supabase Google login). Pure REST — no extra SDK.

const BASE = 'https://www.googleapis.com/calendar/v3';
const TAG = 'focusflow'; // extendedProperties marker so we only touch our own events
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface GEvent {
  id: string;
  status?: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

async function gcal(path: string, token: string, init?: RequestInit): Promise<any> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Kalender-Zugriff abgelaufen – bitte einmal neu mit Google anmelden.');
  }
  if (!res.ok) throw new Error(`Kalender-Fehler (${res.status})`);
  return res.status === 204 ? null : res.json();
}

function eventMinutes(e: GEvent): number {
  const s = e.start?.dateTime, en = e.end?.dateTime;
  if (s && en) {
    const m = Math.round((new Date(en).getTime() - new Date(s).getTime()) / 60000);
    return Math.min(180, Math.max(15, m));
  }
  return 60;
}

/** Import upcoming calendar events as importable project drafts (deduped upstream). */
export async function importEvents(token: string, days = 7): Promise<Partial<Project>[]> {
  const now = new Date();
  const max = new Date(now); max.setDate(max.getDate() + days);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: max.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });
  const data = await gcal(`/calendars/primary/events?${params.toString()}`, token);
  const items: GEvent[] = data?.items ?? [];
  return items
    .filter((e) => e.status !== 'cancelled' && e.summary)
    .map((e) => {
      const startISO = e.start?.dateTime ?? e.start?.date ?? null;
      const mins = eventMinutes(e);
      return {
        name: e.summary as string,
        deadline: startISO ? startISO.slice(0, 10) : null,
        estimateMins: mins,
        weekBudgetH: Math.max(1, Math.round(mins / 60)),
        priority: 'med',
        tag: 'admin',
        status: 'today',
        subtasks: [],
        googleEventId: e.id,
      } as Partial<Project>;
    });
}

function localDateTime(dateStr: string, hhmm: string): string {
  return `${dateStr}T${hhmm.length === 5 ? hhmm : hhmm.padStart(5, '0')}:00`;
}

/**
 * Push the day's planned focus blocks into Google Calendar. Re-running is safe:
 * any previous FocusFlow events on that date are removed first (idempotent).
 * Returns the number of events written.
 */
export async function exportSchedule(token: string, slots: ScheduleSlot[], dateStr: string): Promise<number> {
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59`);
  const findParams = new URLSearchParams({
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    privateExtendedProperty: `${TAG}=1`,
    singleEvents: 'true',
    maxResults: '50',
  });
  const existing = await gcal(`/calendars/primary/events?${findParams.toString()}`, token);
  for (const ev of (existing?.items ?? []) as GEvent[]) {
    await gcal(`/calendars/primary/events/${ev.id}`, token, { method: 'DELETE' });
  }

  const tasks = slots.filter((s) => s.type === 'task');
  let count = 0;
  for (const s of tasks) {
    const body = {
      summary: `🎯 ${s.label}`,
      description: 'Geplant mit FocusFlow',
      start: { dateTime: localDateTime(dateStr, s.start), timeZone: TZ },
      end: { dateTime: localDateTime(dateStr, s.end), timeZone: TZ },
      extendedProperties: { private: { [TAG]: '1' } },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] },
    };
    await gcal('/calendars/primary/events', token, { method: 'POST', body: JSON.stringify(body) });
    count++;
  }
  return count;
}
