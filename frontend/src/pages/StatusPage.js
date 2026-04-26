import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Server, Bug, Globe, Mail, Cpu,
  CheckCircle, Clock, Zap, BarChart3, Activity,
  AlertTriangle, Settings
} from 'lucide-react';
import { useStore } from '../store';
import './StatusPage.css';

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const pipelineConfig = [
  { key: 'endpointChecker', label: 'Endpoint Checker', icon: Server, color: 'var(--primary)', desc: 'Monitors HTTP endpoints' },
  { key: 'logParser', label: 'Backend Log Parser', icon: Bug, color: 'var(--secondary)', desc: 'Parses error logs' },
  { key: 'frontendIngestion', label: 'Frontend Ingestion', icon: Globe, color: 'var(--accent)', desc: 'Client-side error events' },
  { key: 'incidentEngine', label: 'Incident Engine', icon: Cpu, color: 'var(--alert-orange)', desc: 'Dedup & correlation' },
  { key: 'emailNotifier', label: 'Email Notifier', icon: Mail, color: 'var(--alert-red)', desc: 'Alert delivery' },
];

export default function StatusPage() {
  const navigate = useNavigate();
  const health = useStore((s) => s.systemHealth);
  const errorRates = useStore((s) => s.errorRates);
  const getEndpointStats = useStore((s) => s.getEndpointStats);
  const getOpenIncidents = useStore((s) => s.getOpenIncidents);

  const stats = getEndpointStats();
  const openIncidents = getOpenIncidents();

  const overallStatus = Object.values(health)
    .filter(v => typeof v === 'object' && v.status)
    .every(p => p.status === 'running') ? 'OPERATIONAL' : 'DEGRADED';

  const maxRate = Math.max(...errorRates.overall, 1);

  return (
    <div className="page page-enter" id="status-page">
      {/* Back */}
      <button className="back-btn glass-card" onClick={() => navigate(-1)} id="status-back">
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">System Status</h1>
        <p className="page-subtitle">Platform health & pipeline monitoring</p>
      </div>

      {/* Overall Status Banner */}
      <div className={`status-hero glass-card animate-fade-in ${overallStatus === 'OPERATIONAL' ? 'ok' : 'warn'}`}>
        <div className="status-hero-icon">
          {overallStatus === 'OPERATIONAL' ? (
            <CheckCircle size={32} style={{ color: 'var(--accent)' }} />
          ) : (
            <AlertTriangle size={32} style={{ color: 'var(--alert-orange)' }} />
          )}
        </div>
        <div className="status-hero-content">
          <h2 className={`status-hero-label ${overallStatus === 'OPERATIONAL' ? 'ok' : 'warn'}`}>
            {overallStatus}
          </h2>
          <p className="status-hero-desc">
            {overallStatus === 'OPERATIONAL'
              ? 'All pipeline components running normally'
              : 'One or more pipeline components degraded'}
          </p>
        </div>
        <div className="status-hero-meta">
          <span><Clock size={12} /> Uptime: {health.uptime}</span>
          <span><Zap size={12} /> v{health.version}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="status-summary animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="status-sum-card glass-card">
          <Server size={18} style={{ color: 'var(--primary)' }} />
          <div>
            <span className="status-sum-value">{stats.up}/{stats.total}</span>
            <span className="status-sum-label">Endpoints UP</span>
          </div>
        </div>
        <div className="status-sum-card glass-card">
          <AlertTriangle size={18} style={{ color: 'var(--alert-red)' }} />
          <div>
            <span className="status-sum-value">{openIncidents.length}</span>
            <span className="status-sum-label">Open Incidents</span>
          </div>
        </div>
        <div className="status-sum-card glass-card">
          <Activity size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <span className="status-sum-value">{stats.avgUptime}%</span>
            <span className="status-sum-label">Avg Uptime</span>
          </div>
        </div>
      </div>

      {/* Pipeline Status Cards */}
      <div className="status-section animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="status-section-title">Pipeline Components</h2>
        <div className="status-pipelines stagger-children">
          {pipelineConfig.map((p) => {
            const pipeline = health[p.key];
            if (!pipeline) return null;
            const Icon = p.icon;
            const isRunning = pipeline.status === 'running';
            return (
              <div key={p.key} className="status-pipeline-card glass-card" id={`pipeline-${p.key}`}>
                <div className="status-pl-header">
                  <div className="status-pl-icon" style={{ background: `${p.color}15` }}>
                    <Icon size={20} style={{ color: p.color }} />
                  </div>
                  <div className="status-pl-info">
                    <h3 className="status-pl-name">{p.label}</h3>
                    <span className="status-pl-desc">{p.desc}</span>
                  </div>
                  <div className={`status-pl-dot ${isRunning ? 'running' : 'stopped'}`} />
                </div>
                <div className="status-pl-meta">
                  {pipeline.lastRun && (
                    <span><Clock size={11} /> Last Run: {formatTime(pipeline.lastRun)}</span>
                  )}
                  {pipeline.interval && (
                    <span><Zap size={11} /> Interval: {pipeline.interval}</span>
                  )}
                  {pipeline.targetsCount != null && (
                    <span><Server size={11} /> Targets: {pipeline.targetsCount}</span>
                  )}
                  {pipeline.sourcesCount != null && (
                    <span><Bug size={11} /> Sources: {pipeline.sourcesCount}</span>
                  )}
                  {pipeline.eventsLast24h != null && (
                    <span><BarChart3 size={11} /> Events 24h: {pipeline.eventsLast24h}</span>
                  )}
                  {pipeline.appsConnected != null && (
                    <span><Globe size={11} /> Apps: {pipeline.appsConnected}</span>
                  )}
                  {pipeline.deliveredLast24h != null && (
                    <span><Mail size={11} /> Delivered: {pipeline.deliveredLast24h}</span>
                  )}
                  {pipeline.lastDuration && (
                    <span><Activity size={11} /> Duration: {pipeline.lastDuration}</span>
                  )}
                  {pipeline.openIncidents != null && (
                    <span><AlertTriangle size={11} /> Open: {pipeline.openIncidents}</span>
                  )}
                  {pipeline.lastDelivery && (
                    <span><Clock size={11} /> Last Delivery: {formatTime(pipeline.lastDelivery)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Rate Trend */}
      <div className="status-section animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <h2 className="status-section-title">Error Rate — 12h Trend</h2>
        <div className="status-chart glass-card">
          <div className="status-chart-legend">
            <span className="status-legend-item"><span className="status-legend-dot backend" /> Backend</span>
            <span className="status-legend-item"><span className="status-legend-dot frontend" /> Frontend</span>
          </div>
          <div className="status-chart-bars">
            {errorRates.overall.map((val, i) => (
              <div key={i} className="status-bar-col" title={`Hour ${i + 1}: ${val} errors`}>
                <div className="status-bar-stack">
                  <div
                    className="status-bar backend"
                    style={{ height: `${(errorRates.backend[i] / maxRate) * 100}%` }}
                  />
                  <div
                    className="status-bar frontend"
                    style={{ height: `${(errorRates.frontend[i] / maxRate) * 100}%` }}
                  />
                </div>
                <span className="status-bar-label">{i % 3 === 0 ? `${12 - i}h` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="status-actions animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <button className="status-action-btn glass-card" onClick={() => navigate('/settings')}>
          <Settings size={18} />
          <span>Alert Settings</span>
        </button>
        <button className="status-action-btn glass-card" onClick={() => navigate('/alerts')}>
          <AlertTriangle size={18} />
          <span>View Incidents</span>
        </button>
      </div>
    </div>
  );
}
