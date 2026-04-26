import { useState, useMemo } from 'react';
import {
  Search, Filter, Server, Bug, Globe, Activity,
  Mail, X, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useStore } from '../store';
import './HistoryPage.css';

const sourceMeta = {
  endpoint: { icon: Server, color: 'var(--primary)', label: 'Endpoint' },
  backend_log: { icon: Bug, color: 'var(--secondary)', label: 'Backend' },
  frontend_runtime: { icon: Globe, color: 'var(--accent)', label: 'Frontend' },
  alert_delivery: { icon: Mail, color: 'var(--alert-orange)', label: 'Alert' },
};

const severityColors = {
  critical: 'var(--alert-red)',
  warning: 'var(--alert-orange)',
  info: 'var(--primary)',
};

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const options = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric';
  return date.toLocaleDateString('en-US', options);
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const endpoints = useStore((s) => s.endpoints);
  const backendErrors = useStore((s) => s.backendErrors);
  const frontendErrors = useStore((s) => s.frontendErrors);
  const alertDeliveries = useStore((s) => s.alertDeliveries);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Build unified event timeline
  const allEvents = useMemo(() => {
    const epEvents = endpoints.map((ep) => ({
      id: ep.id,
      source: 'endpoint',
      title: ep.name,
      message: ep.status === 'UP'
        ? `${ep.method} ${ep.statusCode} — ${ep.responseTime}ms`
        : ep.error || `HTTP ${ep.statusCode}`,
      severity: ep.status === 'DOWN' ? 'critical' : 'info',
      status: ep.status,
      timestamp: ep.lastChecked,
      component: ep.url.replace('https://', ''),
      detail: {
        method: ep.method,
        url: ep.url,
        category: ep.category,
        uptimePercent: ep.uptimePercent,
      },
    }));

    const beEvents = backendErrors.map((e) => ({
      id: e.id,
      source: 'backend_log',
      title: `${e.service} — ${e.errorClass}`,
      message: e.message,
      severity: e.severity,
      timestamp: e.lastSeen,
      component: e.service,
      count: e.count,
      fingerprint: e.fingerprint,
      detail: {
        stackPreview: e.stackPreview,
        logSource: e.logSource,
        firstSeen: e.firstSeen,
      },
    }));

    const feEvents = frontendErrors.map((e) => ({
      id: e.id,
      source: 'frontend_runtime',
      title: `${e.app} — ${e.errorType.replace(/_/g, ' ')}`,
      message: e.message,
      severity: e.severity,
      timestamp: e.lastSeen,
      component: e.app,
      count: e.count,
      fingerprint: e.fingerprint,
      detail: {
        stackPreview: e.stack,
        url: e.url,
        userAgent: e.userAgent,
        environment: e.environment,
        releaseVersion: e.releaseVersion,
        apiContext: e.apiContext,
      },
    }));

    const alertEvents = alertDeliveries.map((a) => ({
      id: a.id,
      source: 'alert_delivery',
      title: a.incidentTitle,
      message: `${a.type === 'failure' ? '🔴 Failure' : '🟢 Recovery'} alert sent to ${a.recipient}`,
      severity: a.type === 'failure' ? 'critical' : 'info',
      timestamp: a.sentAt,
      component: a.recipient,
      alertType: a.type,
      detail: {
        recipient: a.recipient,
        status: a.status,
        type: a.type,
      },
    }));

    return [...epEvents, ...beEvents, ...feEvents, ...alertEvents].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [endpoints, backendErrors, frontendErrors, alertDeliveries]);

  const filteredEvents = useMemo(() => {
    let items = allEvents;
    if (filterSource !== 'all') {
      items = items.filter((item) => item.source === filterSource);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.message?.toLowerCase().includes(q) ||
          item.component?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [allEvents, filterSource, searchQuery]);

  // Group by time period
  const groupedEvents = useMemo(() => {
    const groups = {};
    filteredEvents.forEach((item) => {
      const date = new Date(item.timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffHr = diffMs / 3600000;
      let label;
      if (diffHr < 1) label = 'Last Hour';
      else if (diffHr < 6) label = 'Last 6 Hours';
      else if (diffHr < 24) label = 'Last 24 Hours';
      else if (diffHr < 72) label = 'Last 3 Days';
      else label = 'Older';
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  }, [filteredEvents]);

  const filterOptions = ['all', 'endpoint', 'backend_log', 'frontend_runtime', 'alert_delivery'];

  return (
    <div className="page page-enter" id="history-page">
      <div className="page-header">
        <h1 className="page-title">Events</h1>
        <p className="page-subtitle">{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} recorded</p>
      </div>

      {/* Search Bar */}
      <div className="history-search glass-card">
        <Search size={18} className="history-search-icon" />
        <input
          type="text"
          placeholder="Search events, services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="history-search-input"
          id="history-search"
        />
        {searchQuery && (
          <button className="history-search-clear" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
        <button
          className={`history-filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          id="history-filter-toggle"
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filter Chips */}
      {showFilters && (
        <div className="history-filters animate-fade-in">
          {filterOptions.map((opt) => {
            const meta = sourceMeta[opt];
            return (
              <button
                key={opt}
                className={`chip ${filterSource === opt ? 'active' : ''}`}
                onClick={() => setFilterSource(opt)}
                id={`filter-${opt}`}
              >
                {opt === 'all' ? 'All' : meta?.label || opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Event List */}
      <div className="history-list">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="history-empty glass-card animate-scale-in">
            <Search size={40} style={{ color: 'var(--text-tertiary)' }} />
            <p>No events found</p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([label, items]) => (
            <div key={label} className="history-group">
              <div className="history-group-label">{label}</div>
              <div className="history-group-items stagger-children">
                {items.map((item) => {
                  const meta = sourceMeta[item.source] || { icon: Activity, color: 'var(--primary)', label: 'Other' };
                  const Icon = meta.icon;
                  const sevColor = severityColors[item.severity] || 'var(--primary)';
                  const isExpanded = expandedId === item.id;
                  const hasDetail = item.detail && (item.detail.stackPreview || item.detail.logSource || item.detail.url || item.detail.recipient);

                  return (
                    <div key={item.id} className="history-item glass-card">
                      <div className="history-item-main" onClick={() => hasDetail && toggleExpand(item.id)}>
                        <div className="history-item-icon" style={{ background: `${sevColor}12` }}>
                          {item.source === 'endpoint' ? (
                            item.status === 'UP' ?
                              <ArrowUpCircle size={16} style={{ color: 'var(--accent)' }} /> :
                              <ArrowDownCircle size={16} style={{ color: 'var(--alert-red)' }} />
                          ) : (
                            <Icon size={16} style={{ color: sevColor }} />
                          )}
                        </div>
                        <div className="history-item-content">
                          <div className="history-item-top">
                            <span className="history-item-tag" style={{ color: meta.color }}>
                              {meta.label}
                            </span>
                            <span className="history-item-time">{formatDate(item.timestamp)}</span>
                          </div>
                          <h4 className="history-item-title">{item.title}</h4>
                          <p className="history-item-body">{item.message}</p>
                          <div className="history-item-meta">
                            <span className="history-item-component">{item.component}</span>
                            {item.count && <span className="history-item-count">×{item.count}</span>}
                            {item.fingerprint && <span className="history-item-fp" title={item.fingerprint}>🔑</span>}
                            {hasDetail && (
                              <span className="history-expand-icon">
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Detail */}
                      {isExpanded && item.detail && (
                        <div className="history-item-detail animate-fade-in">
                          {item.detail.stackPreview && (
                            <div className="history-detail-block">
                              <span className="history-detail-label">Stack Trace</span>
                              <pre className="history-detail-code">{item.detail.stackPreview}</pre>
                            </div>
                          )}
                          {item.detail.logSource && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">Log Source</span>
                              <span className="history-detail-value mono">{item.detail.logSource}</span>
                            </div>
                          )}
                          {item.detail.url && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">URL</span>
                              <span className="history-detail-value mono">{item.detail.url}</span>
                            </div>
                          )}
                          {item.detail.userAgent && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">User Agent</span>
                              <span className="history-detail-value">{item.detail.userAgent}</span>
                            </div>
                          )}
                          {item.detail.environment && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">Environment</span>
                              <span className="history-detail-value">{item.detail.environment} v{item.detail.releaseVersion}</span>
                            </div>
                          )}
                          {item.detail.apiContext && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">API Context</span>
                              <span className="history-detail-value mono">
                                {item.detail.apiContext.method} {item.detail.apiContext.endpoint} → {item.detail.apiContext.statusCode}
                              </span>
                            </div>
                          )}
                          {item.detail.recipient && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">Recipient</span>
                              <span className="history-detail-value mono">{item.detail.recipient}</span>
                            </div>
                          )}
                          {item.detail.uptimePercent != null && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">Uptime</span>
                              <span className="history-detail-value">{item.detail.uptimePercent}%</span>
                            </div>
                          )}
                          {item.detail.firstSeen && (
                            <div className="history-detail-row">
                              <span className="history-detail-label">First Seen</span>
                              <span className="history-detail-value">{formatDate(item.detail.firstSeen)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
