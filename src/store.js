import { create } from 'zustand';
import {
  fetchEndpoints as apiFetchEndpoints,
  fetchIncidents as apiFetchIncidents,
  fetchBackendErrors as apiFetchBackendErrors,
  fetchFrontendErrors as apiFetchFrontendErrors,
  fetchAlerts as apiFetchAlerts,
  fetchSystemHealth as apiFetchSystemHealth,
  fetchDashboard as apiFetchDashboard,
  checkHealth as apiCheckHealth,
} from './api/watchtowerApi';

const generateId = () => Math.random().toString(36).substr(2, 9);

const now = new Date();
const minutesAgo = (m) => new Date(now.getTime() - m * 60000).toISOString();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

const mockUser = {
  id: '1',
  name: 'Nanda Kumar',
  email: 'nanda@ops.trackmyacademy.com',
  avatar: null,
  role: 'SRE Engineer',
  team: 'Platform Reliability',
};

// Helper: generate 24 data points of response times for sparklines
function generateCheckHistory(baseMs, variance, downAt = []) {
  return Array.from({ length: 24 }, (_, i) => {
    const isDown = downAt.includes(i);
    return {
      time: new Date(now.getTime() - (23 - i) * 3600000).toISOString(),
      responseTime: isDown ? null : Math.max(20, baseMs + Math.floor((Math.random() - 0.5) * variance)),
      status: isDown ? 'DOWN' : 'UP',
      statusCode: isDown ? 503 : 200,
    };
  });
}

// ── Monitored Endpoints ──
const initialEndpoints = [
  {
    id: 'ep_001',
    name: 'TMA Web — Home',
    url: 'https://trackmyacademy.com',
    method: 'GET',
    status: 'UP',
    statusCode: 200,
    responseTime: 142,
    lastChecked: minutesAgo(2),
    upSince: daysAgo(12),
    category: 'frontend',
    uptimePercent: 99.94,
    checkHistory: generateCheckHistory(140, 60),
  },
  {
    id: 'ep_002',
    name: 'Player Portal',
    url: 'https://portal.trackmyacademy.com',
    method: 'GET',
    status: 'UP',
    statusCode: 200,
    responseTime: 218,
    lastChecked: minutesAgo(2),
    upSince: daysAgo(5),
    category: 'frontend',
    uptimePercent: 99.82,
    checkHistory: generateCheckHistory(215, 80),
  },
  {
    id: 'ep_003',
    name: 'Auth API — /api/auth/login',
    url: 'https://api.trackmyacademy.com/auth/login',
    method: 'POST',
    status: 'UP',
    statusCode: 200,
    responseTime: 95,
    lastChecked: minutesAgo(2),
    upSince: daysAgo(30),
    category: 'backend',
    uptimePercent: 99.99,
    checkHistory: generateCheckHistory(90, 30),
  },
  {
    id: 'ep_004',
    name: 'Performance API — /api/performance',
    url: 'https://api.trackmyacademy.com/performance',
    method: 'GET',
    status: 'DOWN',
    statusCode: 503,
    responseTime: null,
    lastChecked: minutesAgo(1),
    downSince: minutesAgo(45),
    category: 'backend',
    uptimePercent: 96.87,
    checkHistory: generateCheckHistory(180, 70, [22, 23]),
    error: 'HTTP 503 — Service Unavailable',
  },
  {
    id: 'ep_005',
    name: 'Notification Service',
    url: 'https://api.trackmyacademy.com/notifications',
    method: 'GET',
    status: 'UP',
    statusCode: 200,
    responseTime: 67,
    lastChecked: minutesAgo(2),
    upSince: daysAgo(8),
    category: 'backend',
    uptimePercent: 99.91,
    checkHistory: generateCheckHistory(65, 25),
  },
  {
    id: 'ep_006',
    name: 'Payment Gateway',
    url: 'https://pay.trackmyacademy.com/health',
    method: 'GET',
    status: 'DOWN',
    statusCode: 0,
    responseTime: null,
    lastChecked: minutesAgo(1),
    downSince: hoursAgo(2),
    error: 'ETIMEDOUT — Connection timed out after 10s',
    category: 'backend',
    uptimePercent: 91.67,
    checkHistory: generateCheckHistory(250, 120, [20, 21, 22, 23]),
  },
  {
    id: 'ep_007',
    name: 'CDN Assets',
    url: 'https://cdn.trackmyacademy.com/health',
    method: 'GET',
    status: 'UP',
    statusCode: 200,
    responseTime: 12,
    lastChecked: minutesAgo(2),
    upSince: daysAgo(60),
    category: 'frontend',
    uptimePercent: 100.0,
    checkHistory: generateCheckHistory(12, 8),
  },
  {
    id: 'ep_008',
    name: 'Tournament Service API',
    url: 'https://api.trackmyacademy.com/tournaments',
    method: 'GET',
    status: 'UP',
    statusCode: 200,
    responseTime: 188,
    lastChecked: minutesAgo(2),
    upSince: daysAgo(3),
    category: 'backend',
    uptimePercent: 99.72,
    checkHistory: generateCheckHistory(185, 90),
  },
];

// ── Backend Error Events ──
const initialBackendErrors = [
  {
    id: 'be_001',
    source: 'backend_log',
    service: 'performance-api',
    errorClass: 'DatabaseConnectionError',
    message: 'Connection pool exhausted — max 20 connections reached',
    fingerprint: 'performance-api::DatabaseConnectionError::pool_exhausted',
    severity: 'critical',
    count: 47,
    firstSeen: hoursAgo(2),
    lastSeen: minutesAgo(3),
    stackPreview: 'at ConnectionPool.acquire (db/pool.js:142)\n  at PerformanceService.fetch (services/performance.js:89)\n  at Router.handle (express/router.js:174)\n  at Layer.handle (express/layer.js:95)',
    logSource: '/var/log/performance-api/error.log',
  },
  {
    id: 'be_002',
    source: 'backend_log',
    service: 'auth-service',
    errorClass: 'TokenValidationError',
    message: 'JWT signature verification failed — invalid token payload',
    fingerprint: 'auth-service::TokenValidationError::jwt_invalid',
    severity: 'warning',
    count: 12,
    firstSeen: hoursAgo(6),
    lastSeen: hoursAgo(1),
    stackPreview: 'at TokenValidator.verify (auth/jwt.js:56)\n  at AuthMiddleware.handle (middleware/auth.js:23)\n  at processRequest (server/handler.js:112)',
    logSource: '/var/log/auth-service/error.log',
  },
  {
    id: 'be_003',
    source: 'backend_log',
    service: 'payment-gateway',
    errorClass: 'TimeoutError',
    message: 'Upstream payment provider request timed out after 30000ms',
    fingerprint: 'payment-gateway::TimeoutError::upstream_timeout',
    severity: 'critical',
    count: 156,
    firstSeen: hoursAgo(3),
    lastSeen: minutesAgo(5),
    stackPreview: 'at PaymentClient.charge (clients/payment.js:201)\n  at OrderService.process (services/order.js:77)\n  at PaymentRouter.handle (routes/payment.js:45)',
    logSource: '/var/log/payment-gateway/error.log',
  },
  {
    id: 'be_004',
    source: 'backend_log',
    service: 'notification-service',
    errorClass: 'SMTPError',
    message: 'SMTP connection refused by mail server — relay access denied',
    fingerprint: 'notification-service::SMTPError::relay_denied',
    severity: 'warning',
    count: 8,
    firstSeen: daysAgo(1),
    lastSeen: hoursAgo(12),
    stackPreview: 'at SMTPTransport.send (mailer/smtp.js:89)\n  at EmailService.deliver (services/email.js:34)',
    logSource: '/var/log/notification-service/error.log',
  },
  {
    id: 'be_005',
    source: 'backend_log',
    service: 'tournament-service',
    errorClass: 'ValidationError',
    message: 'Invalid tournament schedule payload — missing required field "start_date"',
    fingerprint: 'tournament-service::ValidationError::missing_start_date',
    severity: 'info',
    count: 3,
    firstSeen: daysAgo(2),
    lastSeen: daysAgo(1),
    stackPreview: 'at TournamentValidator.validate (validators/tournament.js:45)\n  at TournamentController.create (controllers/tournament.js:18)',
    logSource: '/var/log/tournament-service/error.log',
  },
];

// ── Frontend Error Events ──
const initialFrontendErrors = [
  {
    id: 'fe_001',
    source: 'frontend_runtime',
    app: 'player-portal',
    environment: 'production',
    releaseVersion: '3.2.1',
    errorType: 'unhandled_promise_rejection',
    message: 'TypeError: Cannot read properties of undefined (reading "performance_data")',
    url: 'https://portal.trackmyacademy.com/dashboard',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    stack: 'at PerformanceList.render (PerformanceList.jsx:42)\n  at Dashboard.componentDidMount (Dashboard.jsx:28)\n  at ReactDOM.render (react-dom.js:1144)',
    count: 89,
    firstSeen: hoursAgo(1),
    lastSeen: minutesAgo(8),
    severity: 'critical',
    fingerprint: 'player-portal::TypeError::performance_data_undefined',
  },
  {
    id: 'fe_002',
    source: 'frontend_runtime',
    app: 'player-portal',
    environment: 'production',
    releaseVersion: '3.2.1',
    errorType: 'failed_api_call',
    message: 'GET /api/performance — 503 Service Unavailable',
    url: 'https://portal.trackmyacademy.com/performance',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    stack: 'at fetchPerformanceData (api/performance.js:15)\n  at PerformancePage.load (pages/PerformancePage.jsx:22)',
    apiContext: { method: 'GET', endpoint: '/api/performance', statusCode: 503, latency: 12400 },
    count: 134,
    firstSeen: minutesAgo(45),
    lastSeen: minutesAgo(2),
    severity: 'critical',
    fingerprint: 'player-portal::FailedAPI::performance_503',
  },
  {
    id: 'fe_003',
    source: 'frontend_runtime',
    app: 'tma-web',
    environment: 'production',
    releaseVersion: '2.8.0',
    errorType: 'uncaught_error',
    message: 'ReferenceError: analytics is not defined',
    url: 'https://trackmyacademy.com/home',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    stack: 'at TrackEvent (analytics.js:8)\n  at HomePage.onLoad (HomePage.jsx:45)',
    count: 23,
    firstSeen: daysAgo(3),
    lastSeen: hoursAgo(6),
    severity: 'warning',
    fingerprint: 'tma-web::ReferenceError::analytics_undefined',
  },
  {
    id: 'fe_004',
    source: 'frontend_runtime',
    app: 'player-portal',
    environment: 'production',
    releaseVersion: '3.2.1',
    errorType: 'console_error',
    message: 'Failed to load resource: net::ERR_CONNECTION_REFUSED — pay.trackmyacademy.com',
    url: 'https://portal.trackmyacademy.com/payments',
    userAgent: 'Mozilla/5.0 (Linux; Android 14)',
    stack: 'at PaymentForm.submit (PaymentForm.jsx:67)',
    count: 41,
    firstSeen: hoursAgo(2),
    lastSeen: minutesAgo(10),
    severity: 'critical',
    fingerprint: 'player-portal::NetworkError::payment_refused',
  },
];

// ── Unified Incidents ──
const initialIncidents = [
  {
    id: 'inc_001',
    title: 'Performance API Service Outage',
    state: 'OPEN',
    severity: 'critical',
    sourceType: 'endpoint',
    component: 'performance-api',
    fingerprint: 'endpoint::performance-api::DOWN',
    firstSeen: minutesAgo(45),
    lastSeen: minutesAgo(1),
    eventCount: 22,
    description: 'Performance API returning 503 — connection pool exhausted. Frontend users seeing broken performance dashboards. 134 failed API calls captured from browser.',
    linkedSignals: ['endpoint_check', 'backend_log', 'frontend_runtime'],
    linkedEndpoints: ['ep_004'],
    linkedBackendErrors: ['be_001'],
    linkedFrontendErrors: ['fe_001', 'fe_002'],
    timeline: [
      { time: minutesAgo(45), event: 'Endpoint check failed — 503 Service Unavailable', type: 'error' },
      { time: minutesAgo(44), event: 'Retry attempt failed — 503', type: 'error' },
      { time: minutesAgo(44), event: 'Incident opened — state: OPEN', type: 'state' },
      { time: minutesAgo(43), event: 'Email alert sent to oncall@trackmyacademy.com', type: 'alert' },
      { time: minutesAgo(30), event: 'Backend log: DatabaseConnectionError spike (47 occurrences)', type: 'error' },
      { time: minutesAgo(8), event: 'Frontend errors: TypeError in PerformanceList (89 users affected)', type: 'error' },
    ],
  },
  {
    id: 'inc_002',
    title: 'Payment Gateway Timeout',
    state: 'OPEN',
    severity: 'critical',
    sourceType: 'endpoint',
    component: 'payment-gateway',
    fingerprint: 'endpoint::payment-gateway::DOWN',
    firstSeen: hoursAgo(2),
    lastSeen: minutesAgo(1),
    eventCount: 60,
    description: 'Payment gateway unresponsive — upstream provider timeout. Connection refused errors propagating to frontend payment forms.',
    linkedSignals: ['endpoint_check', 'backend_log', 'frontend_runtime'],
    linkedEndpoints: ['ep_006'],
    linkedBackendErrors: ['be_003'],
    linkedFrontendErrors: ['fe_004'],
    timeline: [
      { time: hoursAgo(2), event: 'Endpoint check failed — ETIMEDOUT', type: 'error' },
      { time: hoursAgo(2), event: 'Incident opened — state: OPEN', type: 'state' },
      { time: hoursAgo(2), event: 'Email alert sent to oncall@trackmyacademy.com', type: 'alert' },
      { time: hoursAgo(1), event: 'Backend log: TimeoutError spike (156 occurrences)', type: 'error' },
      { time: minutesAgo(10), event: 'Frontend: ERR_CONNECTION_REFUSED from payment form (41 users)', type: 'error' },
    ],
  },
  {
    id: 'inc_003',
    title: 'JWT Token Validation Failures',
    state: 'ACKNOWLEDGED',
    severity: 'warning',
    sourceType: 'backend_log',
    component: 'auth-service',
    fingerprint: 'backend::auth-service::TokenValidationError',
    firstSeen: hoursAgo(6),
    lastSeen: hoursAgo(1),
    eventCount: 12,
    description: 'Intermittent JWT validation failures. May indicate token rotation issue or clock skew between services.',
    linkedSignals: ['backend_log'],
    linkedEndpoints: [],
    linkedBackendErrors: ['be_002'],
    linkedFrontendErrors: [],
    timeline: [
      { time: hoursAgo(6), event: 'Backend log: TokenValidationError first seen', type: 'error' },
      { time: hoursAgo(5), event: 'Threshold crossed (>10 in 1h) — incident opened', type: 'state' },
      { time: hoursAgo(5), event: 'Email alert sent', type: 'alert' },
      { time: hoursAgo(3), event: 'Acknowledged by Nanda Kumar', type: 'state' },
    ],
  },
  {
    id: 'inc_004',
    title: 'Analytics Script — ReferenceError',
    state: 'RESOLVED',
    severity: 'warning',
    sourceType: 'frontend_runtime',
    component: 'tma-web',
    fingerprint: 'frontend::tma-web::ReferenceError',
    firstSeen: daysAgo(3),
    lastSeen: hoursAgo(6),
    resolvedAt: hoursAgo(5),
    eventCount: 23,
    description: 'Analytics tracking script throwing ReferenceError on homepage. Non-blocking but generating console noise.',
    linkedSignals: ['frontend_runtime'],
    linkedEndpoints: [],
    linkedBackendErrors: [],
    linkedFrontendErrors: ['fe_003'],
    timeline: [
      { time: daysAgo(3), event: 'Frontend: ReferenceError first captured', type: 'error' },
      { time: daysAgo(3), event: 'Incident opened', type: 'state' },
      { time: hoursAgo(5), event: 'Error rate dropped to 0 — auto-resolved', type: 'recovery' },
      { time: hoursAgo(5), event: 'Recovery email sent', type: 'alert' },
    ],
  },
  {
    id: 'inc_005',
    title: 'SMTP Relay Access Denied',
    state: 'RESOLVED',
    severity: 'info',
    sourceType: 'backend_log',
    component: 'notification-service',
    fingerprint: 'backend::notification-service::SMTPError',
    firstSeen: daysAgo(1),
    lastSeen: hoursAgo(12),
    resolvedAt: hoursAgo(10),
    eventCount: 8,
    description: 'Mail server temporarily rejecting relay. Resolved after mail relay config update.',
    linkedSignals: ['backend_log'],
    linkedEndpoints: [],
    linkedBackendErrors: ['be_004'],
    linkedFrontendErrors: [],
    timeline: [
      { time: daysAgo(1), event: 'Backend log: SMTPError first seen', type: 'error' },
      { time: daysAgo(1), event: 'Incident opened', type: 'state' },
      { time: hoursAgo(10), event: 'Error ceased — auto-resolved', type: 'recovery' },
      { time: hoursAgo(10), event: 'Recovery email sent', type: 'alert' },
    ],
  },
];

// ── Alert Deliveries ──
const initialAlertDeliveries = [
  { id: 'ad_001', incidentId: 'inc_001', incidentTitle: 'Performance API Service Outage', type: 'failure', sentAt: minutesAgo(43), recipient: 'oncall@trackmyacademy.com', status: 'delivered' },
  { id: 'ad_002', incidentId: 'inc_002', incidentTitle: 'Payment Gateway Timeout', type: 'failure', sentAt: hoursAgo(2), recipient: 'oncall@trackmyacademy.com', status: 'delivered' },
  { id: 'ad_003', incidentId: 'inc_003', incidentTitle: 'JWT Token Validation Failures', type: 'failure', sentAt: hoursAgo(5), recipient: 'oncall@trackmyacademy.com', status: 'delivered' },
  { id: 'ad_004', incidentId: 'inc_004', incidentTitle: 'Analytics Script — ReferenceError', type: 'recovery', sentAt: hoursAgo(5), recipient: 'oncall@trackmyacademy.com', status: 'delivered' },
  { id: 'ad_005', incidentId: 'inc_005', incidentTitle: 'SMTP Relay Access Denied', type: 'recovery', sentAt: hoursAgo(10), recipient: 'oncall@trackmyacademy.com', status: 'delivered' },
];

// ── System Health / Pipeline Status ──
const systemHealth = {
  endpointChecker: {
    status: 'running',
    lastRun: minutesAgo(2),
    interval: '60s',
    targetsCount: initialEndpoints.length,
    lastDuration: '1.2s',
  },
  logParser: {
    status: 'running',
    lastRun: minutesAgo(5),
    interval: '300s',
    sourcesCount: 5,
    lastDuration: '3.8s',
  },
  frontendIngestion: {
    status: 'running',
    lastRun: minutesAgo(1),
    eventsLast24h: 287,
    appsConnected: 2,
  },
  incidentEngine: {
    status: 'running',
    lastRun: minutesAgo(3),
    openIncidents: 3,
    resolvedLast24h: 2,
  },
  emailNotifier: {
    status: 'running',
    lastDelivery: minutesAgo(43),
    deliveredLast24h: 5,
    failedLast24h: 0,
  },
  uptime: '14d 6h 32m',
  version: '2.0.0',
};

// ── Error rate data for sparklines (last 12 hours) ──
const errorRates = {
  backend: [3, 5, 2, 8, 12, 45, 67, 47, 38, 52, 48, 47],
  frontend: [8, 12, 15, 10, 22, 89, 134, 120, 95, 78, 65, 41],
  overall: [11, 17, 17, 18, 34, 134, 201, 167, 133, 130, 113, 88],
};

export const useStore = create((set, get) => ({
  // ── API State ──
  isLoading: false,
  apiConnected: false,

  // ── Auth ──
  user: null,
  isAuthenticated: false,
  login: () => set({ user: mockUser, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),

  // ── Endpoints ──
  endpoints: initialEndpoints,
  getEndpointsByStatus: (status) => get().endpoints.filter((e) => e.status === status),
  getEndpointById: (id) => get().endpoints.find((e) => e.id === id),
  getEndpointStats: () => {
    const eps = get().endpoints;
    const avgUptime = eps.reduce((sum, e) => sum + (e.uptimePercent || 100), 0) / eps.length;
    return {
      total: eps.length,
      up: eps.filter((e) => e.status === 'UP').length,
      down: eps.filter((e) => e.status === 'DOWN').length,
      avgUptime: avgUptime.toFixed(2),
    };
  },

  // ── Backend Errors ──
  backendErrors: initialBackendErrors,
  getBackendErrorCount24h: () =>
    get().backendErrors.reduce((sum, e) => sum + e.count, 0),
  getBackendErrorsByService: (service) =>
    get().backendErrors.filter((e) => e.service === service),

  // ── Frontend Errors ──
  frontendErrors: initialFrontendErrors,
  getFrontendErrorCount24h: () =>
    get().frontendErrors.reduce((sum, e) => sum + e.count, 0),
  getFrontendErrorsByApp: (app) =>
    get().frontendErrors.filter((e) => e.app === app),

  // ── Incidents ──
  incidents: initialIncidents,
  getOpenIncidents: () => get().incidents.filter((i) => i.state === 'OPEN' || i.state === 'ACKNOWLEDGED'),
  getResolvedIncidents: () => get().incidents.filter((i) => i.state === 'RESOLVED'),
  getIncidentById: (id) => get().incidents.find((i) => i.id === id),
  getIncidentsByComponent: (component) => get().incidents.filter((i) => i.component === component),
  acknowledgeIncident: (id) => {
    set((state) => ({
      incidents: state.incidents.map((i) =>
        i.id === id
          ? {
              ...i,
              state: 'ACKNOWLEDGED',
              timeline: [
                ...i.timeline,
                { time: new Date().toISOString(), event: `Acknowledged by ${get().user?.name || 'Operator'}`, type: 'state' },
              ],
            }
          : i
      ),
    }));
  },
  resolveIncident: (id) => {
    set((state) => ({
      incidents: state.incidents.map((i) =>
        i.id === id
          ? {
              ...i,
              state: 'RESOLVED',
              resolvedAt: new Date().toISOString(),
              timeline: [
                ...i.timeline,
                { time: new Date().toISOString(), event: `Resolved by ${get().user?.name || 'Operator'}`, type: 'recovery' },
              ],
            }
          : i
      ),
    }));
  },

  // ── Alert Deliveries ──
  alertDeliveries: initialAlertDeliveries,
  getAlertsByIncident: (incidentId) =>
    get().alertDeliveries.filter((a) => a.incidentId === incidentId),

  // ── System Health ──
  systemHealth,

  // ── Error Rates (sparkline data) ──
  errorRates,

  // ── All Signals (unified view) ──
  getAllSignals: () => {
    const eps = get().endpoints.filter((e) => e.status === 'DOWN').map((e) => ({
      id: e.id,
      sourceType: 'endpoint',
      title: `${e.name} — DOWN`,
      message: e.error || `HTTP ${e.statusCode}`,
      severity: 'critical',
      timestamp: e.lastChecked,
      component: e.name,
    }));
    const be = get().backendErrors.map((e) => ({
      id: e.id,
      sourceType: 'backend_log',
      title: `${e.service} — ${e.errorClass}`,
      message: e.message,
      severity: e.severity,
      timestamp: e.lastSeen,
      component: e.service,
      count: e.count,
      stackPreview: e.stackPreview,
    }));
    const fe = get().frontendErrors.map((e) => ({
      id: e.id,
      sourceType: 'frontend_runtime',
      title: `${e.app} — ${e.errorType.replace(/_/g, ' ')}`,
      message: e.message,
      severity: e.severity,
      timestamp: e.lastSeen,
      component: e.app,
      count: e.count,
      stackPreview: e.stack,
    }));
    return [...eps, ...be, ...fe].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  },

  // ── Settings ──
  settings: {
    theme: 'light',
    endpointAlerts: true,
    backendAlerts: true,
    frontendAlerts: true,
    emailCooldown: 15,
    severityThreshold: 'warning',
    soundAlerts: true,
    ingestionKey: 'pk_live_a8f3...d92e',
    samplingRate: 100,
  },
  updateSetting: (key, value) => {
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }));
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
  },
  toggleTheme: () => {
    const current = get().settings.theme;
    const next = current === 'light' ? 'dark' : 'light';
    get().updateSetting('theme', next);
  },

  // ── Live API Loading Actions ──
  checkApiHealth: async () => {
    const result = await apiCheckHealth();
    set({ apiConnected: !!result });
    return !!result;
  },

  loadEndpoints: async () => {
    set({ isLoading: true });
    const data = await apiFetchEndpoints();
    if (data && Array.isArray(data) && data.length > 0) {
      set({ endpoints: data, apiConnected: true });
    }
    set({ isLoading: false });
  },

  loadIncidents: async () => {
    set({ isLoading: true });
    const data = await apiFetchIncidents();
    if (data && Array.isArray(data) && data.length > 0) {
      set({ incidents: data, apiConnected: true });
    }
    set({ isLoading: false });
  },

  loadBackendErrors: async () => {
    const data = await apiFetchBackendErrors();
    if (data && Array.isArray(data)) {
      set({ backendErrors: data.length > 0 ? data : get().backendErrors, apiConnected: true });
    }
  },

  loadFrontendErrors: async () => {
    const data = await apiFetchFrontendErrors();
    if (data && Array.isArray(data)) {
      set({ frontendErrors: data.length > 0 ? data : get().frontendErrors, apiConnected: true });
    }
  },

  loadAlertDeliveries: async () => {
    const data = await apiFetchAlerts();
    if (data && Array.isArray(data)) {
      set({ alertDeliveries: data.length > 0 ? data : get().alertDeliveries, apiConnected: true });
    }
  },

  loadSystemHealth: async () => {
    const data = await apiFetchSystemHealth();
    if (data) {
      set({ systemHealth: { ...get().systemHealth, ...data }, apiConnected: true });
    }
  },

  loadDashboard: async () => {
    const data = await apiFetchDashboard();
    if (data) {
      set({ dashboardSummary: data, apiConnected: true });
    }
  },

  // Load all data from the API at once
  loadAllData: async () => {
    set({ isLoading: true });
    const health = await apiCheckHealth();
    if (health) {
      set({ apiConnected: true });
      await Promise.all([
        get().loadEndpoints(),
        get().loadIncidents(),
        get().loadBackendErrors(),
        get().loadFrontendErrors(),
        get().loadAlertDeliveries(),
        get().loadSystemHealth(),
        get().loadDashboard(),
      ]);
    } else {
      set({ apiConnected: false });
    }
    set({ isLoading: false });
  },

  // Dashboard summary from API
  dashboardSummary: null,
}));
