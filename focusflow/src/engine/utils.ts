export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addMins(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export function timeDiff(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return (bh * 60 + bm) - (ah * 60 + am);
}

export function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

export function isUrgent(deadline: string | null): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  return (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 3;
}

export function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function tagLabel(t: string): string {
  const labels: Record<string, string> = {
    focus: '🎯 Deep Work',
    creative: '🎨 Kreativ',
    energy: '⚡ High Energy',
    admin: '📋 Admin',
  };
  return labels[t] ?? t;
}

export const TAG_COLORS: Record<string, string> = {
  focus: 'var(--focus)',
  creative: 'var(--pri)',
  energy: 'var(--warn)',
  admin: 'var(--tx2)',
};

export const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
