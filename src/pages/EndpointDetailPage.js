import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpCircle, ArrowDownCircle, Clock, Globe,
  Server, Zap, AlertTriangle, ExternalLink, Activity
} from 'lucide-react';
import { useStore } from '../store';
import './EndpointDetailPage.css';

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDuration(isoString) {
  const start = new Date(isoString);
  const now = new Date();
  const diffMs = now - start;
  const d = Math.floor(diffMs / 86400000);
  const h = Math.floor((diffMs % 86400000) / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function EndpointDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const endpoint = useStore((s) => s.getEndpointById(id));
  const incidents = useStore((s) => s.getIncidentsByComponent(endpoint?.name?.split(' —')[0] || ''));

  if (!endpoint) {
    return (
      <div className="page page-enter" id="endpoint-detail-page">
        <button className="back-btn glass-card" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="detail-empty glass-card animate-scale-in">
          <Server size={48} />
          <h3>Endpoint not found</h3>
        </div>
      </div>
    );
  }

  const isUp = endpoint.status === 'UP';
  const history = endpoint.checkHistory || [];
  const maxRT = Math.max(...history.filter(h => h.responseTime).map(h => h.responseTime), 1);
  const linkedIncidents = useStore((s) => s.incidents.filter(i =>
    i.linkedEndpoints?.includes(endpoint.id)
  ));

  return (
    <div className="page page-enter" id="endpoint-detail-page">
      {/* Back button */}
      <button className="back-btn glass-card" onClick={() => navigate(-1)} id="ep-back">
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Status Hero */}
      <div className={`ep-hero glass-card animate-fade-in ${isUp ? 'up' : 'down'}`}>
        <div className="ep-hero-status">
          <div className={`ep-hero-dot ${isUp ? 'up' : 'down'}`}>
            {!isUp && <div className="ep-hero-dot-pulse" />}
          </div>
          <span className={`ep-hero-badge ${isUp ? 'up' : 'down'}`}>
            {isUp ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
            {endpoint.status}
          </span>
        </div>
        <h1 className="ep-hero-name">{endpoint.name}</h1>
        <p className="ep-hero-url">
          <span className="ep-method-badge">{endpoint.method}</span>
          {endpoint.url.replace('https://', '')}
        </p>
        <div className="ep-hero-meta">
          <span><Clock size={12} /> {formatTime(endpoint.lastChecked)}</span>
          <span className={`ep-category-tag ${endpoint.category}`}>
            {endpoint.category === 'frontend' ? <Globe size={12} /> : <Server size={12} />}
            {endpoint.category}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="ep-stat-row animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="ep-stat-card glass-card">
          <span className="ep-stat-label">Response Time</span>
          <span className="ep-stat-value">
            {endpoint.responseTime ? `${endpoint.responseTime}ms` : '—'}
          </span>
        </div>
        <div className="ep-stat-card glass-card">
          <span className="ep-stat-label">Uptime (30d)</span>
          <span className={`ep-stat-value ${endpoint.uptimePercent >= 99.9 ? 'good' : endpoint.uptimePercent >= 99 ? 'warn' : 'bad'}`}>
            {endpoint.uptimePercent}%
          </span>
        </div>
        <div className="ep-stat-card glass-card">
          <span className="ep-stat-label">{isUp ? 'Up Since' : 'Down Since'}</span>
          <span className="ep-stat-value small">
            {formatDuration(isUp ? endpoint.upSince : endpoint.downSince)}
          </span>
        </div>
      </div>

      {/* Error info */}
      {endpoint.error && (
        <div className="ep-error-banner glass-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <AlertTriangle size={16} />
          <span>{endpoint.error}</span>
        </div>
      )}

      {/* Response Time Chart */}
      <div className="ep-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="ep-section-title">
          <Activity size={16} /> Response Time — 24h
        </h2>
        <div className="ep-chart glass-card">
          <div className="ep-chart-bars">
            {history.map((h, i) => {
              const height = h.responseTime ? (h.responseTime / maxRT) * 100 : 4;
              const isDown = h.status === 'DOWN';
              return (
                <div key={i} className="ep-chart-bar-wrapper" title={
                  isDown ? `${new Date(h.time).getHours()}:00 — DOWN` :
                  `${new Date(h.time).getHours()}:00 — ${h.responseTime}ms`
                }>
                  <div
                    className={`ep-chart-bar ${isDown ? 'down' : ''}`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="ep-chart-labels">
            <span>24h ago</span>
            <span>12h ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* Check History */}
      <div className="ep-section animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <h2 className="ep-section-title">
          <Clock size={16} /> Recent Checks
        </h2>
        <div className="ep-checks glass-card">
          {history.slice(-8).reverse().map((check, i) => (
            <div key={i} className="ep-check-row">
              <div className={`ep-check-dot ${check.status === 'UP' ? 'up' : 'down'}`} />
              <span className="ep-check-time">
                {new Date(check.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="ep-check-status">{check.status}</span>
              <span className="ep-check-code">{check.statusCode}</span>
              <span className="ep-check-rt">
                {check.responseTime ? `${check.responseTime}ms` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Incidents */}
      {linkedIncidents.length > 0 && (
        <div className="ep-section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="ep-section-title">
            <AlertTriangle size={16} /> Linked Incidents
          </h2>
          <div className="ep-incidents stagger-children">
            {linkedIncidents.map((inc) => (
              <button
                key={inc.id}
                className="ep-incident-card glass-card"
                onClick={() => navigate(`/incident/${inc.id}`)}
              >
                <div className="ep-incident-left">
                  <span className={`incident-state-badge ${inc.state.toLowerCase()}`}>{inc.state}</span>
                  <span className="ep-incident-title">{inc.title}</span>
                </div>
                <Zap size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
