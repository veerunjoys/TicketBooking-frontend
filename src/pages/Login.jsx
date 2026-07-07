import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ActionLoader from '../components/ActionLoader';

const Login = ({ adminMode = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { user, token, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminLogin = adminMode || location.pathname.startsWith('/admin');

  React.useEffect(() => {
    if (location.state?.signupSuccess) {
      setSuccessMessage('Account created successfully. Please sign in with your new credentials.');
    } else if (location.state?.adminOnly) {
      setError('Please sign in with an admin account to continue.');
    }
  }, [location.state]);

  React.useEffect(() => {
    if (isAdminLogin && user?.role === 'admin' && token) {
      navigate('/admin', { replace: true });
      return;
    }

    if (isAdminLogin && user && user.role !== 'admin') {
      logout();
    }
  }, [isAdminLogin, user, token, navigate, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      if (isAdminLogin && result.user?.role !== 'admin') {
        await logout();
        setError('This login is only for admin accounts.');
        return;
      }

      if (isAdminLogin) {
        navigate('/admin');
      } else {
        navigate(location.state?.from?.pathname || '/', {
          state: location.state?.from?.state,
        });
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '1rem',
    }}>
      <div className="glass-panel-glow fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          marginBottom: '0.5rem',
          textAlign: 'center',
          background: 'var(--gradient-main)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isAdminLogin ? 'Admin Login' : 'Welcome Back'}
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          {isAdminLogin ? 'Sign in to manage events, bookings, payments, and ticket monitoring.' : 'Sign in to secure your event tickets.'}
        </p>

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={submitting}
          >
            {submitting ? <ActionLoader label="Signing in..." /> : 'Sign In'}
          </button>
        </form>

        <p style={{
          display: isAdminLogin ? 'none' : 'block',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
