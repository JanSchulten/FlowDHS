import type { Project, Priority, Tag, BoardStatus, Subtask } from '../types';
import { uid } from './utils';

/**
 * Google Sheets sync.
 *
 * Fully client-side: uses Google Identity Services (GIS) for an OAuth2 access
 * token, then the Sheets REST API to read/write the user's spreadsheet as a
 * lightweight database. No backend required.
 *
 * The user supplies:
 *  - an OAuth Client ID (from their own Google Cloud project)
 *  - a link to a Google Sheet they own
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const API = 'https://sheets.googleapis.com/v4/spreadsheets';

const PROJECT_TAB = 'Projects';
const SUBTASK_TAB = 'Subtasks';

const PROJECT_HEADER = [
  'id', 'name', 'deadline', 'weekBudgetH', 'estimateMins',
  'priority', 'tag', 'done', 'status', 'actualMins', 'note', 'createdAt',
];
const SUBTASK_HEADER = ['id', 'projectId', 'name', 'dur', 'done'];

/* ── minimal GIS typing ── */
interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
  callback: (resp: TokenResponse) => void;
}
interface GoogleGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (resp: TokenResponse) => void;
      }) => TokenClient;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

let scriptPromise: Promise<void> | null = null;
let cachedToken: { value: string; expiresAt: number } | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google-Skript konnte nicht geladen werden.'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Resolve a valid OAuth access token, prompting the user if needed. */
export async function getAccessToken(clientId: string, forceConsent = false): Promise<string> {
  if (!clientId.trim()) throw new Error('Keine OAuth-Client-ID hinterlegt.');
  if (!forceConsent && cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }
  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Google Identity Services nicht verfügbar.');

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || 'Anmeldung abgebrochen.'));
          return;
        }
        cachedToken = {
          value: resp.access_token,
          expiresAt: Date.now() + resp.expires_in * 1000,
        };
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: forceConsent ? 'consent' : '' });
  });
}

export function signOut() {
  cachedToken = null;
}

/** Extract the spreadsheet id from any Google Sheets / Drive link. */
export function parseSheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

async function api<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets-API ${res.status}: ${body.slice(0, 160)}`);
  }
  return res.json() as Promise<T>;
}

/** Make sure both tabs exist; create the ones that are missing. */
async function ensureTabs(token: string, sheetId: string): Promise<void> {
  const meta = await api<{ sheets: { properties: { title: string } }[] }>(
    token,
    `/${sheetId}?fields=sheets.properties.title`
  );
  const titles = new Set(meta.sheets.map((s) => s.properties.title));
  const requests = [PROJECT_TAB, SUBTASK_TAB]
    .filter((t) => !titles.has(t))
    .map((title) => ({ addSheet: { properties: { title } } }));
  if (requests.length) {
    await api(token, `/${sheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }
}

function bool(v: string | undefined): boolean {
  return String(v).toUpperCase() === 'TRUE';
}

/** Write the full project list into the sheet (last-write-wins). */
export async function pushProjects(
  clientId: string,
  sheetUrl: string,
  projects: Project[]
): Promise<void> {
  const sheetId = parseSheetId(sheetUrl);
  if (!sheetId) throw new Error('Ungültiger Sheet-Link.');
  const token = await getAccessToken(clientId);
  await ensureTabs(token, sheetId);

  const projectRows = [
    PROJECT_HEADER,
    ...projects.map((p) => [
      p.id, p.name, p.deadline ?? '', String(p.weekBudgetH), String(p.estimateMins),
      p.priority, p.tag, p.done ? 'TRUE' : 'FALSE', p.status,
      String(p.actualMins ?? 0), p.note ?? '', String(p.createdAt),
    ]),
  ];
  const subtaskRows = [
    SUBTASK_HEADER,
    ...projects.flatMap((p) =>
      p.subtasks.map((s) => [s.id, p.id, s.name, String(s.dur), s.done ? 'TRUE' : 'FALSE'])
    ),
  ];

  // Clear then write — keeps the sheet a faithful mirror of app state.
  await api(token, `/${sheetId}/values/${PROJECT_TAB}!A:Z:clear`, { method: 'POST', body: '{}' });
  await api(token, `/${sheetId}/values/${SUBTASK_TAB}!A:Z:clear`, { method: 'POST', body: '{}' });
  await api(token, `/${sheetId}/values/${PROJECT_TAB}!A1?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: projectRows }),
  });
  await api(token, `/${sheetId}/values/${SUBTASK_TAB}!A1?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: subtaskRows }),
  });
}

/** Read the project list back from the sheet. */
export async function pullProjects(clientId: string, sheetUrl: string): Promise<Project[]> {
  const sheetId = parseSheetId(sheetUrl);
  if (!sheetId) throw new Error('Ungültiger Sheet-Link.');
  const token = await getAccessToken(clientId);
  await ensureTabs(token, sheetId);

  const [pData, sData] = await Promise.all([
    api<{ values?: string[][] }>(token, `/${sheetId}/values/${PROJECT_TAB}!A2:L`),
    api<{ values?: string[][] }>(token, `/${sheetId}/values/${SUBTASK_TAB}!A2:E`),
  ]);

  const subtasksByProject = new Map<string, Subtask[]>();
  for (const r of sData.values ?? []) {
    const [id, projectId, name, dur, done] = r;
    if (!projectId) continue;
    const list = subtasksByProject.get(projectId) ?? [];
    list.push({ id: id || uid(), name: name ?? '', dur: Number(dur) || 25, done: bool(done) });
    subtasksByProject.set(projectId, list);
  }

  return (pData.values ?? [])
    .filter((r) => r[0])
    .map((r): Project => ({
      id: r[0],
      name: r[1] ?? '',
      deadline: r[2] ? r[2] : null,
      weekBudgetH: Number(r[3]) || 2,
      estimateMins: Number(r[4]) || 60,
      priority: (r[5] as Priority) || 'med',
      tag: (r[6] as Tag) || 'focus',
      done: bool(r[7]),
      status: (r[8] as BoardStatus) || 'backlog',
      actualMins: Number(r[9]) || 0,
      note: r[10] || undefined,
      createdAt: Number(r[11]) || Date.now(),
      subtasks: subtasksByProject.get(r[0]) ?? [],
    }));
}
