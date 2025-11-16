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

  return (
    <div className="auth-modal">
      <div className="auth-container">
        <button className="close-btn" onClick={() => onGuestLogin()}>✕</button>

        <h1>Log in</h1>
        <p className="auth-subtitle">Welcome back!</p>

        <button className="social-btn google-btn">
          <span>🔍</span> Continue with Google
        </button>
        <button className="social-btn apple-btn">
          <span>🍎</span> Continue with Apple
        </button>
        <button className="social-btn microsoft-btn">
          <span>⊞</span> Continue with Microsoft
        </button>

        <div className="divider">OR</div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup} className="link-btn">
            Sign up
          </button>
        </p>

        <button onClick={onGuestLogin} className="guest-btn">
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
