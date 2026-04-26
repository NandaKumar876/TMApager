/**
 * WatchTower API Client
 * Centralized client for communicating with the WatchTower backend.
 * Uses Vite proxy in development (/api/* → localhost:8000).
 */

const BASE_URL = import.meta.env.VITE_WATCHTOWER_API_URL || '';

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[WatchTower API] ${endpoint} failed:`, error.message);
    return null;
  }
}

// ── Dashboard ──
export async function fetchDashboard() {
  return apiRequest('/api/dashboard');
}

// ── Endpoints ──
export async function fetchEndpoints() {
  return apiRequest('/api/endpoints');
}

export async function fetchEndpointDetail(dbId) {
  return apiRequest(`/api/endpoints/${dbId}`);
}

// ── Incidents ──
export async function fetchIncidents() {
  return apiRequest('/api/incidents');
}

export async function fetchIncidentDetail(dbId) {
  return apiRequest(`/api/incidents/${dbId}`);
}

// ── Errors ──
export async function fetchBackendErrors() {
  return apiRequest('/api/errors/backend');
}

export async function fetchFrontendErrors() {
  return apiRequest('/api/errors/frontend');
}

// ── Alerts ──
export async function fetchAlerts() {
  return apiRequest('/api/alerts');
}

// ── System Health ──
export async function fetchSystemHealth() {
  return apiRequest('/api/system-health');
}

// ── Health Check ──
export async function checkHealth() {
  return apiRequest('/health');
}
