import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Activity } from 'lucide-react';
import { useStore } from '../store';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login();
    setIsLoading(false);
    navigate('/', { replace: true });
  };

  const handleDemoLogin = async () => {
    setEmail('nanda@ops.trackmyacademy.com');
    setPassword('••••••••');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    login();
    setIsLoading(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <div className="login-content animate-fade-in-up">
        {/* Logo & Branding */}
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#logo-grad)" />
                <path d="M12 10v16M12 10l6 4-6 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 14h6M20 18h4M20 22h6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36">
                    <stop stopColor="#007AFF" />
                    <stop offset="1" stopColor="#5AC8FA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="login-logo-text">Pager</span>
          </div>
          <h1 className="login-title">Monitor. Detect. Resolve.</h1>
          <p className="login-subtitle">Hybrid monitoring & error collection platform</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-input-group glass-card">
            <div className="login-input-row">
              <Mail size={18} className="login-input-icon" />
              <input
                type="email"
                placeholder="Work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                id="login-email"
                autoComplete="email"
              />
            </div>
            <div className="login-input-divider" />
            <div className="login-input-row">
              <Lock size={18} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                id="login-password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={isLoading}
            id="login-submit"
          >
            {isLoading ? (
              <div className="login-spinner" />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="login-separator">
          <span>or</span>
        </div>

        {/* SSO / Quick Access */}
        <div className="login-social-row">
          <button className="login-social-btn glass-card" id="login-sso">
            <Shield size={20} />
            <span>SSO Login</span>
          </button>
          <button className="login-social-btn glass-card" id="login-api-key">
            <Activity size={20} />
            <span>API Key</span>
          </button>
        </div>

        {/* Demo Access */}
        <button
          className="login-demo-btn"
          onClick={handleDemoLogin}
          id="login-demo"
        >
          Try Demo Dashboard →
        </button>

        {/* Footer */}
        <p className="login-footer">
          Need access? <span className="login-link">Request from admin</span>
        </p>
      </div>
    </div>
  );
}
