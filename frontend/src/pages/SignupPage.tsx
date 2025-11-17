import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../pages/AuthPage.css';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onGuestLogin: () => void;
}

export function SignupPage({ onSwitchToLogin, onGuestLogin }: SignupPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
    } catch (err) {
      setError('Signup failed. Email may already be registered.');
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
        <button className="auth-close-btn" onClick={() => onGuestLogin()} aria-label="Close signup">
          ✕
        </button>

        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Enter your email to get started, then finish setting your password.</p>
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
          <label className="sr-only" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <label className="sr-only" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <label className="sr-only" htmlFor="signup-confirm-password">
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Continuing…' : 'Continue'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link-btn">
            Log in
          </button>
        </p>

        <button onClick={onGuestLogin} className="ghost-btn">
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
