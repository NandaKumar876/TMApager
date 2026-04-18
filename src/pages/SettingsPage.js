import { useNavigate } from 'react-router-dom';
import {
  User, Moon, Sun, Server, Bug, Globe,
  ShieldAlert, Volume2, LogOut, ChevronRight,
  Info, Key, Timer, BarChart3, Mail
} from 'lucide-react';
import { useStore } from '../store';
import './SettingsPage.css';

const monitorSettings = [
  { key: 'endpointAlerts', label: 'Endpoint Monitoring', desc: 'UP/DOWN state change alerts', icon: Server, color: 'var(--primary)' },
  { key: 'backendAlerts', label: 'Backend Log Alerts', desc: 'Exception threshold alerts', icon: Bug, color: 'var(--secondary)' },
  { key: 'frontendAlerts', label: 'Frontend Error Alerts', desc: 'Runtime & API failure alerts', icon: Globe, color: 'var(--accent)' },
];

export default function SettingsPage() {
  const user = useStore((s) => s.user);
  const settings = useStore((s) => s.settings);
  const updateSetting = useStore((s) => s.updateSetting);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isDark = settings.theme === 'dark';

  return (
    <div className="page page-enter" id="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="settings-profile glass-card animate-fade-in">
        <div className="settings-avatar">
          <User size={28} />
        </div>
        <div className="settings-profile-info">
          <h3 className="settings-profile-name">{user?.name || 'Operator'}</h3>
          <p className="settings-profile-email">{user?.email || 'ops@trackmyacademy.com'}</p>
          <p className="settings-profile-meta">{user?.role || 'SRE'} · {user?.team || 'Platform'}</p>
        </div>
        <ChevronRight size={18} className="settings-profile-arrow" />
      </div>

      {/* Appearance */}
      <div className="settings-section animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-group glass-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(88, 86, 214, 0.12)' }}>
                {isDark ? <Moon size={18} style={{ color: 'var(--secondary)' }} /> : <Sun size={18} style={{ color: 'var(--secondary)' }} />}
              </div>
              <div>
                <span className="settings-row-label">Dark Mode</span>
                <span className="settings-row-desc">{isDark ? 'Dark theme active' : 'Light theme active'}</span>
              </div>
            </div>
            <div className={`toggle ${isDark ? 'active' : ''}`} onClick={toggleTheme} id="toggle-theme" />
          </div>
        </div>
      </div>

      {/* Alert Preferences */}
      <div className="settings-section animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="settings-section-title">Alert Channels</h2>
        <div className="settings-group glass-card">
          {monitorSettings.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.key}>
                <div className="settings-row">
                  <div className="settings-row-left">
                    <div className="settings-row-icon" style={{ background: `${item.color}15` }}>
                      <Icon size={18} style={{ color: item.color }} />
                    </div>
                    <div>
                      <span className="settings-row-label">{item.label}</span>
                      <span className="settings-row-desc">{item.desc}</span>
                    </div>
                  </div>
                  <div
                    className={`toggle ${settings[item.key] ? 'active' : ''}`}
                    onClick={() => updateSetting(item.key, !settings[item.key])}
                    id={`toggle-${item.key}`}
                  />
                </div>
                {i < monitorSettings.length - 1 && <div className="settings-divider" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical & Email */}
      <div className="settings-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="settings-section-title">Priority & Email</h2>
        <div className="settings-group glass-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(255, 59, 48, 0.12)' }}>
                <ShieldAlert size={18} style={{ color: 'var(--alert-red)' }} />
              </div>
              <div>
                <span className="settings-row-label">Critical Incidents</span>
                <span className="settings-row-desc settings-row-desc-warn">Always notified — cannot disable</span>
              </div>
            </div>
            <div className="toggle active" style={{ opacity: 0.6, pointerEvents: 'none' }} />
          </div>
          <div className="settings-divider" />
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(255, 149, 0, 0.12)' }}>
                <Timer size={18} style={{ color: 'var(--alert-orange)' }} />
              </div>
              <div>
                <span className="settings-row-label">Email Cooldown</span>
                <span className="settings-row-desc">{settings.emailCooldown} min between duplicate alerts</span>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="settings-divider" />
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(255, 149, 0, 0.12)' }}>
                <Volume2 size={18} style={{ color: 'var(--alert-orange)' }} />
              </div>
              <div>
                <span className="settings-row-label">Sound Alerts</span>
                <span className="settings-row-desc">Play sound on critical incidents</span>
              </div>
            </div>
            <div
              className={`toggle ${settings.soundAlerts ? 'active' : ''}`}
              onClick={() => updateSetting('soundAlerts', !settings.soundAlerts)}
              id="toggle-sound"
            />
          </div>
        </div>
      </div>

      {/* Ingestion Config */}
      <div className="settings-section animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <h2 className="settings-section-title">Frontend Ingestion</h2>
        <div className="settings-group glass-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(0, 122, 255, 0.12)' }}>
                <Key size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <span className="settings-row-label">API Key</span>
                <span className="settings-row-desc settings-mono">{settings.ingestionKey}</span>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="settings-divider" />
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(52, 199, 89, 0.12)' }}>
                <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <span className="settings-row-label">Sampling Rate</span>
                <span className="settings-row-desc">{settings.samplingRate}% of frontend errors captured</span>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="settings-divider" />
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-row-icon" style={{ background: 'rgba(0, 122, 255, 0.12)' }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <span className="settings-row-label">Alert Recipients</span>
                <span className="settings-row-desc">oncall@trackmyacademy.com</span>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        className="settings-logout-btn animate-fade-in-up"
        style={{ animationDelay: '0.3s' }}
        onClick={handleLogout}
        id="settings-logout"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      {/* App Info */}
      <div className="settings-app-info animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <Info size={14} />
        <span>Pager Platform v2.0.0</span>
      </div>
    </div>
  );
}
