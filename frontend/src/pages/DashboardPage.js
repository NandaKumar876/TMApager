import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Server, AlertTriangle, Bug, Globe,
  ChevronRight, ArrowUpCircle, ArrowDownCircle, Zap, Cpu, Wifi, WifiOff
} from 'lucide-react';
import { useStore } from '../store';
import './DashboardPage.css';

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const sourceIcons = {
  endpoint: Server,
  backend_log: Bug,
  frontend_runtime: Globe,
};

const sourceLabels = {
  endpoint: 'Endpoint',
  backend_log: 'Backend',
  frontend_runtime: 'Frontend',
};

const severityColors = {
  critical: 'var(--alert-red)',
  warning: 'var(--alert-orange)',
  info: 'var(--primary)',
};

function Sparkline({ data, color = 'var(--primary)' }) {
  const max = Math.max(...data, 1);
  return (
    <div className="sparkline">
      {data.map((val, i) => (
        <div
          key={i}
          className="sparkline-bar"
          style={{
            height: `${Math.max((val / max) * 100, 4)}%`,
            background: color,
            opacity: i >= data.length - 3 ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const user = useStore((s) => s.user);
  const endpoints = useStore((s) => s.endpoints);
  const getEndpointStats = useStore((s) => s.getEndpointStats);
  const getOpenIncidents = useStore((s) => s.getOpenIncidents);
  const getBackendErrorCount24h = useStore((s) => s.getBackendErrorCount24h);
  const getFrontendErrorCount24h = useStore((s) => s.getFrontendErrorCount24h);
  const getAllSignals = useStore((s) => s.getAllSignals);
  const errorRates = useStore((s) => s.errorRates);
  const loadAllData = useStore((s) => s.loadAllData);
  const apiConnected = useStore((s) => s.apiConnected);
  const isLoading = useStore((s) => s.isLoading);
  const navigate = useNavigate();

  useEffect(() => {
    loadAllData();
    // Refresh every 60 seconds
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const stats = getEndpointStats();
  const openIncidents = getOpenIncidents();
  const backendErrors = getBackendErrorCount24h();
  const frontendErrors = getFrontendErrorCount24h();
  const signals = getAllSignals().slice(0, 5);

  const overallStatus =
    openIncidents.some((i) => i.severity === 'critical')
      ? 'OUTAGE'
      : openIncidents.length > 0
        ? 'DEGRADED'
        : 'HEALTHY';

  const statusConfig = {
    HEALTHY: { color: 'var(--accent)', label: 'All Systems Operational', bg: 'rgba(52,199,89,0.1)' },
    DEGRADED: { color: 'var(--alert-orange)', label: 'Partial Degradation', bg: 'rgba(255,149,0,0.1)' },
    OUTAGE: { color: 'var(--alert-red)', label: 'Active Incidents', bg: 'rgba(255,59,48,0.1)' },
  };

  const sc = statusConfig[overallStatus];

  return (
    <div className="page page-enter" id="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <p className="greeting-text">
            <Activity size={14} style={{ color: 'var(--primary-light)' }} /> Platform Status
          </p>
          <h1 className="greeting-name">Dashboard</h1>
        </div>
        <div className="dashboard-user-badge glass-card" onClick={() => navigate('/settings')}>
          <span>{user?.name?.charAt(0) || 'U'}</span>
        </div>
      </div>

      {/* System Status Banner */}
      <div
        className="status-banner glass-card animate-fade-in"
        style={{ borderLeft: `3px solid ${sc.color}` }}
      >
        <div className="status-banner-dot" style={{ background: sc.color }}>
          {overallStatus === 'OUTAGE' && <div className="status-banner-pulse" style={{ background: sc.color }} />}
        </div>
        <div className="status-banner-content">
          <span className="status-banner-label" style={{ color: sc.color }}>{overallStatus}</span>
          <span className="status-banner-desc">{sc.label}</span>
        </div>
        <Zap size={16} style={{ color: sc.color }} />
      </div>

      {/* Stat Cards */}
      <div className="dashboard-categories stagger-children">
        <button className="category-card glass-card" onClick={() => navigate('/notifications')} id="stat-endpoints">
          <div className="category-icon" style={{ background: 'rgba(0,122,255,0.1)' }}>
            <Server size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <span className="category-label">Endpoints</span>
          <div className="stat-value">
            <span className="stat-up"><ArrowUpCircle size={12} /> {stats.up}</span>
            {stats.down > 0 && <span className="stat-down"><ArrowDownCircle size={12} /> {stats.down}</span>}
          </div>
          <div className="stat-sparkline-container">
            <Sparkline data={errorRates.overall.slice(-6)} color="var(--primary)" />
          </div>
        </button>

        <button className="category-card glass-card" onClick={() => navigate('/alerts')} id="stat-incidents">
          <div className="category-icon" style={{ background: 'rgba(255,59,48,0.1)' }}>
            <AlertTriangle size={22} style={{ color: 'var(--alert-red)' }} />
          </div>
          <span className="category-label">Incidents</span>
          <div className="stat-value">
            <span className={openIncidents.length > 0 ? 'stat-down' : 'stat-up'}>{openIncidents.length} open</span>
          </div>
          {openIncidents.length > 0 && <span className="badge">{openIncidents.length}</span>}
        </button>

        <button className="category-card glass-card" onClick={() => navigate('/notifications')} id="stat-backend">
          <div className="category-icon" style={{ background: 'rgba(88,86,214,0.1)' }}>
            <Bug size={22} style={{ color: 'var(--secondary)' }} />
          </div>
          <span className="category-label">Backend Errors</span>
          <div className="stat-value">
            <span className={backendErrors > 50 ? 'stat-down' : 'stat-up'}>{backendErrors} / 24h</span>
          </div>
          <div className="stat-sparkline-container">
            <Sparkline data={errorRates.backend.slice(-6)} color="var(--secondary)" />
          </div>
        </button>

        <button className="category-card glass-card" onClick={() => navigate('/notifications')} id="stat-frontend">
          <div className="category-icon" style={{ background: 'rgba(52,199,89,0.1)' }}>
            <Globe size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="category-label">Frontend Errors</span>
          <div className="stat-value">
            <span className={frontendErrors > 50 ? 'stat-down' : 'stat-up'}>{frontendErrors} / 24h</span>
          </div>
          <div className="stat-sparkline-container">
            <Sparkline data={errorRates.frontend.slice(-6)} color="var(--accent)" />
          </div>
        </button>
      </div>

      {/* System Health Link */}
      <button className="health-link-card glass-card animate-fade-in" onClick={() => navigate('/status')} id="health-link">
        <div className="health-link-left">
          <div className="health-link-icon">
            <Cpu size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <span className="health-link-title">System Health</span>
            <span className="health-link-desc">Pipeline status & error trends</span>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {/* Active Incident Banner */}
      {openIncidents.filter((i) => i.severity === 'critical').length > 0 && (
        <button
          className="alert-banner animate-fade-in"
          onClick={() => navigate('/alerts')}
          id="incident-banner"
        >
          <div className="alert-banner-pulse" />
          <AlertTriangle size={20} />
          <div className="alert-banner-content">
            <strong>{openIncidents.filter((i) => i.severity === 'critical').length} Critical Incident{openIncidents.filter((i) => i.severity === 'critical').length > 1 ? 's' : ''}</strong>
            <span>{openIncidents.filter((i) => i.severity === 'critical')[0]?.title}</span>
          </div>
          <ChevronRight size={18} />
        </button>
      )}

      {/* Recent Signals */}
      <div className="dashboard-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="section-header">
          <h2 className="section-title">Recent Signals</h2>
          <button className="section-link" onClick={() => navigate('/notifications')}>
            See All <ChevronRight size={14} />
          </button>
        </div>
        <div className="recent-list stagger-children">
          {signals.map((signal) => {
            const Icon = sourceIcons[signal.sourceType] || Activity;
            const sevColor = severityColors[signal.severity] || 'var(--primary)';
            return (
              <div key={signal.id} className="recent-card glass-card">
                <div className="recent-card-icon" style={{ background: `${sevColor}15` }}>
                  <Icon size={18} style={{ color: sevColor }} />
                </div>
                <div className="recent-card-content">
                  <div className="recent-card-top">
                    <span className="signal-source-tag" style={{ color: sevColor }}>
                      {sourceLabels[signal.sourceType]}
                    </span>
                    {signal.count && <span className="signal-count">×{signal.count}</span>}
                  </div>
                  <h3 className="recent-card-title">{signal.title}</h3>
                  <p className="recent-card-body">{signal.message}</p>
                  <span className="recent-card-time">{formatTime(signal.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Endpoint Status List */}
      <div className="dashboard-section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="section-header">
          <h2 className="section-title">Endpoint Status</h2>
        </div>
        <div className="endpoint-list glass-card">
          {endpoints.map((ep, i) => (
            <div key={ep.id}>
              <button
                className="endpoint-row"
                onClick={() => navigate(`/endpoint/${ep.id}`)}
                id={`endpoint-row-${ep.id}`}
              >
                <div className={`endpoint-dot ${ep.status === 'UP' ? 'up' : 'down'}`} />
                <div className="endpoint-info">
                  <span className="endpoint-name">{ep.name}</span>
                  <span className="endpoint-url">{ep.method} {ep.url.replace('https://', '')}</span>
                </div>
                <div className="endpoint-status-info">
                  {ep.status === 'UP' ? (
                    <>
                      <span className="endpoint-latency">{ep.responseTime}ms</span>
                      <span className="endpoint-uptime">{ep.uptimePercent}%</span>
                    </>
                  ) : (
                    <span className="endpoint-down-label">DOWN</span>
                  )}
                  <ChevronRight size={14} className="endpoint-chevron" />
                </div>
              </button>
              {i < endpoints.length - 1 && <div className="endpoint-divider" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
