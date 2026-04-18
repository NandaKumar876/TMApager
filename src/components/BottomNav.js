import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Radio, AlertTriangle, Clock, Settings } from 'lucide-react';
import { useStore } from '../store';
import './BottomNav.css';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/notifications', icon: Radio, label: 'Signals' },
  { path: '/alerts', icon: AlertTriangle, label: 'Incidents' },
  { path: '/history', icon: Clock, label: 'Events' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const openIncidents = useStore((s) => s.getOpenIncidents().length);
  const downEndpoints = useStore((s) => s.getEndpointsByStatus('DOWN').length);

  return (
    <nav className="bottom-nav glass-nav" id="bottom-navigation">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        const badgeCount =
          tab.path === '/notifications' ? downEndpoints :
          tab.path === '/alerts' ? openIncidents : 0;

        return (
          <button
            key={tab.path}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            id={`nav-tab-${tab.label.toLowerCase()}`}
          >
            <div className="nav-tab-icon-wrapper">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {badgeCount > 0 && (
                <span className="nav-badge">{badgeCount}</span>
              )}
            </div>
            <span className="nav-tab-label">{tab.label}</span>
            {isActive && <div className="nav-tab-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
