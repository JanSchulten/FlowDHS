import { CalendarCheck, CalendarRange, Layers, KanbanSquare, Brain, Timer, Settings, CalendarClock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Toggle } from '../ui/Toggle';

interface NavItem {
  page: string;
  label: string;
  icon: LucideIcon;
  group: string | null;
  badgeKey?: 'open' | 'dump';
}

const NAV: NavItem[] = [
  { page: 'today', label: 'Tagesplan', icon: CalendarCheck, group: 'Heute' },
  { page: 'week', label: 'Wochenplan', icon: CalendarRange, group: null },
  { page: 'fixtures', label: 'Fixtermine', icon: CalendarClock, group: null },
  { page: 'board', label: 'Board', icon: KanbanSquare, group: 'Projekte' },
  { page: 'projects', label: 'Alle Projekte', icon: Layers, group: null, badgeKey: 'open' },
  { page: 'inbox', label: 'Brain-Dump', icon: Brain, group: null, badgeKey: 'dump' },
  { page: 'focus', label: 'Fokus-Timer', icon: Timer, group: null },
  { page: 'settings', label: 'Einstellungen', icon: Settings, group: 'System' },
];

interface Props {
  activePage: string;
  openCount: number;
  dumpCount: number;
  calmMode: boolean;
  onNavigate: (page: string) => void;
  onToggleCalm: (v: boolean) => void;
}

export function SideBar({ activePage, openCount, dumpCount, calmMode, onNavigate, onToggleCalm }: Props) {
  const badge = (item: NavItem): number | null => {
    if (item.badgeKey === 'open') return openCount || null;
    if (item.badgeKey === 'dump') return dumpCount || null;
    return null;
  };

  return (
    <nav className="sidebar" aria-label="Hauptnavigation">
      {NAV.map((item) => (
        <div key={item.page}>
          {item.group && <div className="nav-label">{item.group}</div>}
          <div
            className={`nav-item ${activePage === item.page ? 'active' : ''}`}
            onClick={() => onNavigate(item.page)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
            aria-current={activePage === item.page ? 'page' : undefined}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate(item.page)}
            data-label={item.label}
          >
            <item.icon />
            <span>{item.label}</span>
            {badge(item) != null && <span className="nav-badge">{badge(item)}</span>}
          </div>
        </div>
      ))}

      <div className="sidebar-foot">
        <div className="calm-toggle">
          <span>🧘 Ruhe-Modus</span>
          <Toggle checked={calmMode} onChange={onToggleCalm} aria-label="Ruhe-Modus umschalten" />
        </div>
      </div>
    </nav>
  );
}
