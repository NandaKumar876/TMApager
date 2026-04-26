import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store';
import BottomNav from './components/BottomNav';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import AlertsPage from './pages/AlertsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import EndpointDetailPage from './pages/EndpointDetailPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import StatusPage from './pages/StatusPage';
import './App.css';

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const location = useLocation();
  const hideNav = location.pathname === '/login';

  return (
    <div className="app-shell">
      <div className="app-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/endpoint/:id" element={<ProtectedRoute><EndpointDetailPage /></ProtectedRoute>} />
          <Route path="/incident/:id" element={<ProtectedRoute><IncidentDetailPage /></ProtectedRoute>} />
          <Route path="/status" element={<ProtectedRoute><StatusPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </div>
      {!hideNav && isAuthenticated && <BottomNav />}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
