import { fmtDate } from '../../engine/utils';

interface Props {
  deadline: string;
  done?: boolean;
}

export function DeadlineChip({ deadline, done }: Props) {
  if (done) {
    return <span className="deadline-chip deadline-done">✓ {fmtDate(deadline)}</span>;
  }
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const cls = days <= 1 ? 'deadline-crit' : days <= 3 ? 'deadline-warn' : 'deadline-ok';
  const lbl = days < 0 ? 'Überfällig!' : days === 0 ? 'Heute!' : days === 1 ? 'Morgen' : `${days} Tage`;
  return <span className={`deadline-chip ${cls}`}>⏰ {lbl}</span>;
}
