import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, Check,
  Server, Bug, Globe, Clock, Link2, Eye, Mail
} from 'lucide-react';
import { useStore } from '../store';
import './AlertsPage.css';

const severityColors = {
  critical: 'var(--alert-red)',
  warning: 'var(--alert-orange)',
  info: 'var(--primary)',
};

const sourceIcons = {
  endpoint: Server,
  backend_log: Bug,
  frontend_runtime: Globe,
};

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function formatDuration(start, end) {
  const diff = (new Date(end) - new Date(start)) / 1000;
  if (diff < 60) return `${Math.round(diff)}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h ${Math.round((diff % 3600) / 60)}m`;
}

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'resolved', label: 'Resolved' },
];

export default function AlertsPage() {
  const incidents = useStore((s) => s.incidents);
  const acknowledgeIncident = useStore((s) => s.acknowledgeIncident);
  const resolveIncident = useStore((s) => s.resolveIncident);
  const alertDeliveries = useStore((s) => s.alertDeliveries);
  const [expandedId, setExpandedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  // Filter incidents
  const filteredIncidents = incidents.filter((i) => {
    if (activeFilter === 'all') return i.state !== 'RESOLVED';
    if (activeFilter === 'critical') return i.severity === 'critical' && i.state !== 'RESOLVED';
    if (activeFilter === 'warning') return i.severity === 'warning' && i.state !== 'RESOLVED';
    if (activeFilter === 'resolved') return i.state === 'RESOLVED';
    return true;
  });

  const openCount = incidents.filter(i => i.state === 'OPEN' || i.state === 'ACKNOWLEDGED').length;
  const critCount = incidents.filter(i => i.severity === 'critical' && i.state !== 'RESOLVED').length;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderIncident = (incident) => {
    const isExpanded = expandedId === incident.id;
    const sevColor = severityColors[incident.severity] || 'var(--primary)';
    const SourceIcon = sourceIcons[incident.sourceType] || AlertTriangle;
    const incidentAlerts = alertDeliveries.filter(a => a.incidentId === incident.id);

    return (
      <div
        key={incident.id}
        className={`alert-card ${incident.severity === 'critical' && incident.state === 'OPEN' ? 'critical' : ''} ${incident.state === 'RESOLVED' ? 'read' : ''}`}
        id={`incident-${incident.id}`}
      >
        {incident.severity === 'critical' && incident.state === 'OPEN' && (
          <div className="alert-card-pulse-container">
            <div className="alert-card-pulse-ring" />
          </div>
        )}

        <div className="alert-card-header" onClick={() => toggleExpand(incident.id)}>
          <div className="alert-card-icon" style={{ background: `${sevColor}15`, color: sevColor }}>
            {incident.severity === 'critical' ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div className="alert-card-header-content">
            <div className="alert-card-meta">
              <span className={`incident-state-badge ${incident.state.toLowerCase()}`}>
                {incident.state}
              </span>
              <span className="alert-critical-badge" style={{ background: sevColor }}>
                {incident.severity.toUpperCase()}
              </span>
              <span className="alert-card-time">{formatTime(incident.lastSeen)}</span>
            </div>
            <h3
              className="alert-card-title clickable"
              onClick={(e) => { e.stopPropagation(); navigate(`/incident/${incident.id}`); }}
            >
              {incident.title}
            </h3>
            <div className="incident-meta-row">
              <SourceIcon size={12} />
              <span>{incident.component}</span>
              <span className="incident-event-count">{incident.eventCount} events</span>
            </div>
          </div>
          <div className="alert-card-chevron">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {isExpanded && (
          <div className="alert-card-body animate-fade-in">
            <p className="alert-card-text">{incident.description}</p>

            {/* Linked Signal Sources */}
            <div className="incident-linked">
              <span className="incident-linked-label"><Link2 size={12} /> Linked Sources</span>
              <div className="incident-linked-tags">
                {incident.linkedSignals.map((sig) => (
                  <span key={sig} className="incident-linked-tag">{sig.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="incident-timeline">
              <span className="incident-timeline-label"><Clock size={12} /> Timeline</span>
              {incident.timeline.slice(-4).map((entry, i) => (
                <div key={i} className="timeline-entry">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-time">{formatTime(entry.time)}</span>
                    <span className="timeline-event">{entry.event}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Alert deliveries mini log */}
            {incidentAlerts.length > 0 && (
              <div className="incident-alerts-mini">
                <span className="incident-linked-label"><Mail size={12} /> Alerts Sent</span>
                {incidentAlerts.map((a) => (
                  <div key={a.id} className="alert-mini-row">
                    <span className={`alert-mini-type ${a.type}`}>{a.type}</span>
                    <span className="alert-mini-to">{a.recipient}</span>
                    <span className="alert-mini-time">{formatTime(a.sentAt)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Duration */}
            {incident.state === 'RESOLVED' && incident.resolvedAt && (
              <div className="incident-duration">
                Duration: {formatDuration(incident.firstSeen, incident.resolvedAt)}
              </div>
            )}

            {/* Action Buttons */}
            {incident.state !== 'RESOLVED' && (
              <div className="alert-card-actions">
                {incident.state === 'OPEN' && (
                  <button
                    className="alert-action-btn ack"
                    onClick={(e) => { e.stopPropagation(); acknowledgeIncident(incident.id); }}
                    id={`ack-${incident.id}`}
                  >
                    <Eye size={16} /> Acknowledge
                  </button>
                )}
                <button
                  className="alert-ack-btn"
                  onClick={(e) => { e.stopPropagation(); resolveIncident(incident.id); }}
                  id={`resolve-${incident.id}`}
                >
                  <Check size={16} /> Resolve
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page page-enter" id="alerts-page">
      <div className="page-header">
        <h1 className="page-title">Incidents</h1>
        <p className="page-subtitle">
          {openCount} open · {critCount} critical
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="alerts-filter-tabs">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={`chip ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
            id={`filter-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredIncidents.length > 0 ? (
        <div className="alerts-list stagger-children">
          {filteredIncidents.map(renderIncident)}
        </div>
      ) : (
        <div className="alerts-empty glass-card animate-scale-in">
          <div className="alerts-empty-icon">
            <ShieldAlert size={48} />
          </div>
          <h3>{activeFilter === 'resolved' ? 'No Resolved Incidents' : 'All Clear'}</h3>
          <p>{activeFilter === 'resolved' ? 'No incidents have been resolved yet' : 'No incidents match this filter'}</p>
        </div>
      )}
    </div>
  );
}
