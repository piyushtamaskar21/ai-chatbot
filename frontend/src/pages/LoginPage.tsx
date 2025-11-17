import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../pages/AuthPage.css';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onGuestLogin: () => void;
}

export function LoginPage({ onSwitchToSignup, onGuestLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    { label: 'Continue with Google', key: 'google' },
    { label: 'Continue with Microsoft', key: 'microsoft' },
    { label: 'Continue with Apple', key: 'apple' },
  ] as const;

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <button className="auth-close-btn" onClick={() => onGuestLogin()} aria-label="Close login">
          ✕
        </button>

        <div className="auth-header">
          <h1>Log in</h1>
          <p>Welcome back! Continue with a provider or your email.</p>
        </div>

        <div className="oauth-button-group">
          {providers.map((provider) => (
            <button
              type="button"
              key={provider.key}
              className={`oauth-btn oauth-btn--${provider.key}`}
            >
              <span className={`oauth-icon oauth-icon--${provider.key}`} aria-hidden="true" />
              <span>{provider.label}</span>
            </button>
          ))}
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="sr-only" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <label className="sr-only" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Continuing…' : 'Continue'}
          </button>
        </form>

        <p className="auth-footer">
          New to the platform?{' '}
          <button onClick={onSwitchToSignup} className="link-btn">
            Create an account
          </button>
        </p>

        <button onClick={onGuestLogin} className="ghost-btn">
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
