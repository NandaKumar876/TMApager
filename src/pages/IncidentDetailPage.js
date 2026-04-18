import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldAlert, AlertTriangle, Check, Clock,
  Server, Bug, Globe, Link2, Mail, Zap, Eye
} from 'lucide-react';
import { useStore } from '../store';
import './IncidentDetailPage.css';

const severityColors = {
  critical: 'var(--alert-red)',
  warning: 'var(--alert-orange)',
  info: 'var(--primary)',
};

const sourceIcons = {
  endpoint: Server,
  endpoint_check: Server,
  backend_log: Bug,
  frontend_runtime: Globe,
};

const timelineTypeIcons = {
  error: AlertTriangle,
  state: Zap,
  alert: Mail,
  recovery: Check,
};

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatFullTime(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(start, end) {
  const diff = (new Date(end) - new Date(start)) / 1000;
  if (diff < 60) return `${Math.round(diff)}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.round((diff % 3600) / 60)}m`;
}

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const incident = useStore((s) => s.getIncidentById(id));
  const acknowledgeIncident = useStore((s) => s.acknowledgeIncident);
  const resolveIncident = useStore((s) => s.resolveIncident);
  const alertDeliveries = useStore((s) => s.getAlertsByIncident(id));

  if (!incident) {
    return (
      <div className="page page-enter" id="incident-detail-page">
        <button className="back-btn glass-card" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="detail-empty glass-card animate-scale-in">
          <ShieldAlert size={48} />
          <h3>Incident not found</h3>
        </div>
      </div>
    );
  }

  const sevColor = severityColors[incident.severity] || 'var(--primary)';
  const SourceIcon = sourceIcons[incident.sourceType] || AlertTriangle;

  return (
    <div className="page page-enter" id="incident-detail-page">
      {/* Back */}
      <button className="back-btn glass-card" onClick={() => navigate(-1)} id="inc-back">
        <ArrowLeft size={20} />
        <span>Incidents</span>
      </button>

      {/* Severity Banner */}
      <div
        className={`inc-hero glass-card animate-fade-in ${incident.state === 'RESOLVED' ? 'resolved' : ''}`}
        style={{ borderLeft: `4px solid ${sevColor}` }}
      >
        {incident.state !== 'RESOLVED' && incident.severity === 'critical' && (
          <div className="inc-hero-pulse" style={{ background: sevColor }} />
        )}
        <div className="inc-hero-top">
          <div className="inc-hero-badges">
            <span className={`incident-state-badge ${incident.state.toLowerCase()}`}>
              {incident.state}
            </span>
            <span className="inc-severity-badge" style={{ background: `${sevColor}15`, color: sevColor }}>
              {incident.severity.toUpperCase()}
            </span>
          </div>
          <span className="inc-hero-time">{formatTime(incident.firstSeen)}</span>
        </div>
        <h1 className="inc-hero-title">{incident.title}</h1>
        <div className="inc-hero-meta">
          <SourceIcon size={14} />
          <span>{incident.component}</span>
          <span className="inc-events-badge">{incident.eventCount} events</span>
        </div>
      </div>

      {/* Description */}
      <div className="inc-section animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="inc-description glass-card">
          <p>{incident.description}</p>
        </div>
      </div>

      {/* Duration / Timestamps */}
      <div className="inc-timestamps animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
        <div className="inc-ts-card glass-card">
          <span className="inc-ts-label">First Seen</span>
          <span className="inc-ts-value">{formatFullTime(incident.firstSeen)}</span>
        </div>
        <div className="inc-ts-card glass-card">
          <span className="inc-ts-label">Last Seen</span>
          <span className="inc-ts-value">{formatFullTime(incident.lastSeen)}</span>
        </div>
        {incident.resolvedAt && (
          <div className="inc-ts-card glass-card resolved">
            <span className="inc-ts-label">Duration</span>
            <span className="inc-ts-value">{formatDuration(incident.firstSeen, incident.resolvedAt)}</span>
          </div>
        )}
      </div>

      {/* Linked Signal Sources */}
      <div className="inc-section animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="inc-section-title">
          <Link2 size={16} /> Linked Sources
        </h2>
        <div className="inc-linked-tags">
          {incident.linkedSignals.map((sig) => {
            const Icon = sourceIcons[sig] || Zap;
            return (
              <span key={sig} className="inc-linked-tag glass-card">
                <Icon size={12} />
                {sig.replace(/_/g, ' ')}
              </span>
            );
          })}
        </div>
      </div>

      {/* Full Timeline */}
      <div className="inc-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="inc-section-title">
          <Clock size={16} /> Timeline
        </h2>
        <div className="inc-timeline glass-card">
          {incident.timeline.map((entry, i) => {
            const isLast = i === incident.timeline.length - 1;
            const TypeIcon = timelineTypeIcons[entry.type] || Zap;
            const typeColors = {
              error: 'var(--alert-red)',
              state: 'var(--primary)',
              alert: 'var(--alert-orange)',
              recovery: 'var(--accent)',
            };
            const tColor = typeColors[entry.type] || 'var(--primary)';
            return (
              <div key={i} className="inc-tl-entry">
                <div className="inc-tl-track">
                  <div className="inc-tl-dot" style={{ background: tColor, boxShadow: `0 0 6px ${tColor}40` }}>
                    <TypeIcon size={10} style={{ color: 'white' }} />
                  </div>
                  {!isLast && <div className="inc-tl-line" />}
                </div>
                <div className="inc-tl-content">
                  <span className="inc-tl-time">{formatTime(entry.time)}</span>
                  <span className="inc-tl-event">{entry.event}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Deliveries */}
      {alertDeliveries.length > 0 && (
        <div className="inc-section animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h2 className="inc-section-title">
            <Mail size={16} /> Alert History
          </h2>
          <div className="inc-alerts glass-card">
            {alertDeliveries.map((alert) => (
              <div key={alert.id} className="inc-alert-row">
                <div className={`inc-alert-type ${alert.type}`}>
                  {alert.type === 'failure' ? <AlertTriangle size={12} /> : <Check size={12} />}
                  {alert.type}
                </div>
                <span className="inc-alert-recipient">{alert.recipient}</span>
                <span className="inc-alert-time">{formatTime(alert.sentAt)}</span>
                <span className={`inc-alert-status ${alert.status}`}>{alert.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {incident.state !== 'RESOLVED' && (
        <div className="inc-actions animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {incident.state === 'OPEN' && (
            <button
              className="inc-action-btn acknowledge"
              onClick={() => acknowledgeIncident(incident.id)}
              id="inc-acknowledge"
            >
              <Eye size={18} />
              Acknowledge
            </button>
          )}
          <button
            className="inc-action-btn resolve"
            onClick={() => resolveIncident(incident.id)}
            id="inc-resolve"
          >
            <Check size={18} />
            Resolve Incident
          </button>
        </div>
      )}

      {/* Fingerprint */}
      <div className="inc-fingerprint animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <span>🔑 {incident.fingerprint}</span>
      </div>
    </div>
  );
}
