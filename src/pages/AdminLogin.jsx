import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ActionLoader from '../components/ActionLoader';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, token, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.adminOnly) {
      setError('Admin access requires an admin account. Please sign in with admin credentials.');
    }
  }, [location.state]);

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      navigate('/admin', { replace: true });
      return;
    }

    if (user && user.role !== 'admin') {
      logout();
      setError('Admin access requires an admin account. Please sign in with admin credentials.');
    }
  }, [user, token, navigate, logout]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (result.user?.role !== 'admin') {
      await logout();
      setError('This panel is only for admin accounts.');
      return;
    }

    navigate('/admin', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(380px, 1.1fr)',
      background: '#f7f9ff',
    }}>
      <section style={{
        padding: '3rem',
        background: '#111827',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.2rem' }}>
          <ShieldCheck size={28} />
          TicketGlow Admin
        </div>

        <div>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(20, 184, 166, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            <LockKeyhole size={28} color="#5eead4" />
          </div>
          <h1 style={{ fontSize: '2.4rem', lineHeight: 1.1, marginBottom: '1rem' }}>
            Operations access only
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.7, maxWidth: '440px' }}>
            Sign in here to create events, generate seats, monitor bookings, manage refunds, and audit payments.
          </p>
        </div>

        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Customer ticket booking is separate from this admin workspace.
        </div>
      </section>

      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div className="glass-panel-glow fade-in" style={{
          width: '100%',
          maxWidth: '430px',
          padding: '2.5rem',
          borderRadius: '8px',
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Admin Login
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '2rem' }}>
            Use admin credentials to open the management dashboard.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', borderRadius: '8px' }}
              disabled={submitting}
            >
              {submitting ? (
                <ActionLoader label="Checking access..." />
              ) : (
                <>
                  <LockKeyhole size={18} />
                  Open Admin Dashboard
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
