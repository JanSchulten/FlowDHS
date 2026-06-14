import { CalendarCheck, CalendarRange, Layers, Timer, Settings } from 'lucide-react';

const NAV = [
  { page: 'today', label: 'Tagesplan', icon: CalendarCheck, group: 'Heute' },
  { page: 'week', label: 'Wochenplan', icon: CalendarRange, group: null },
  { page: 'projects', label: 'Alle Projekte', icon: Layers, group: 'Projekte' },
  { page: 'focus', label: 'Fokus-Timer', icon: Timer, group: null },
  { page: 'settings', label: 'Einstellungen', icon: Settings, group: 'System' },
];

interface Props {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function SideBar({ activePage, onNavigate }: Props) {
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
          </div>
        </div>
      ))}
    </nav>
  );
}
