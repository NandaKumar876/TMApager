import { useState } from 'react';
import { Server, Bug, Globe, Radio, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store';
import './NotificationsPage.css';

const categories = [
  { key: 'all', label: 'All', icon: Radio },
  { key: 'endpoint', label: 'Endpoint', icon: Server },
  { key: 'backend_log', label: 'Backend', icon: Bug },
  { key: 'frontend_runtime', label: 'Frontend', icon: Globe },
];

const severityColors = {
  critical: 'var(--alert-red)',
  warning: 'var(--alert-orange)',
  info: 'var(--primary)',
};

const severityBg = {
  critical: 'rgba(255, 59, 48, 0.1)',
  warning: 'rgba(255, 149, 0, 0.1)',
  info: 'rgba(0, 122, 255, 0.1)',
};

const sourceIcons = {
  endpoint: Server,
  backend_log: Bug,
  frontend_runtime: Globe,
};

const sourceLabels = {
  endpoint: 'Endpoint',
  backend_log: 'Backend Log',
  frontend_runtime: 'Frontend Runtime',
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

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const getAllSignals = useStore((s) => s.getAllSignals);

  const allSignals = getAllSignals();
  const filtered =
    activeCategory === 'all'
      ? allSignals
      : allSignals.filter((s) => s.sourceType === activeCategory);

  const critCount = allSignals.filter((s) => s.severity === 'critical').length;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="page page-enter" id="notifications-page">
      <div className="page-header">
        <div className="notif-header-row">
          <h1 className="page-title">Signals</h1>
          {critCount > 0 && (
            <span className="signal-crit-count">
              {critCount} critical
            </span>
          )}
        </div>
        <p className="page-subtitle">
          Unified feed — endpoints, backend logs, frontend errors
        </p>
      </div>

      {/* Category Chips */}
      <div className="notif-chips">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`chip ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
            id={`chip-${cat.key}`}
          >
            <cat.icon size={14} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Signal List */}
      <div className="notif-list stagger-children">
        {filtered.length === 0 ? (
          <div className="notif-empty glass-card">
            <Activity size={40} style={{ color: 'var(--text-tertiary)' }} />
            <p>No signals in this category</p>
          </div>
        ) : (
          filtered.map((signal) => {
            const sevColor = severityColors[signal.severity] || 'var(--primary)';
            const sevBg = severityBg[signal.severity] || 'rgba(0,122,255,0.1)';
            const Icon = sourceIcons[signal.sourceType] || Activity;
            const isExpanded = expandedId === signal.id;
            const hasStack = signal.stackPreview && signal.stackPreview.length > 0;

            return (
              <div key={signal.id} className="notif-card glass-card" id={`signal-${signal.id}`}>
                <div className="notif-card-main">
                  <div className="notif-card-left">
                    <div className="notif-card-icon" style={{ background: sevBg }}>
                      <Icon size={18} style={{ color: sevColor }} />
                    </div>
                  </div>
                  <div className="notif-card-content">
                    <div className="notif-card-meta">
                      <div className="signal-meta-left">
                        <span className="notif-card-category" style={{ color: sevColor }}>
                          {sourceLabels[signal.sourceType]}
                        </span>
                        <span className="signal-severity-badge" style={{ background: sevBg, color: sevColor }}>
                          {signal.severity}
                        </span>
                      </div>
                      <span className="notif-card-time">{formatTime(signal.timestamp)}</span>
                    </div>
                    <h3 className="notif-card-title">{signal.title}</h3>
                    <p className="notif-card-body">{signal.message}</p>
                    <div className="signal-footer">
                      <span className="signal-component">{signal.component}</span>
                      {signal.count && <span className="signal-occurrences">×{signal.count} occurrences</span>}
                      {hasStack && (
                        <button
                          className="signal-stack-toggle"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(signal.id); }}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Hide' : 'Stack'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Stack Trace */}
                {isExpanded && hasStack && (
                  <div className="signal-stack-preview animate-fade-in">
                    <pre className="signal-stack-code">{signal.stackPreview}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
