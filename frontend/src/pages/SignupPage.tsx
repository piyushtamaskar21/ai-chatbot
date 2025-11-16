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

  return (
    <div className="auth-modal">
      <div className="auth-container">
        <button className="close-btn" onClick={() => onGuestLogin()}>✕</button>

        <h1>Sign up</h1>
        <p className="auth-subtitle">Create your account</p>

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
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link-btn">
            Log in
          </button>
        </p>

        <button onClick={onGuestLogin} className="guest-btn">
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
