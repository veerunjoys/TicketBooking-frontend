import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ActionLoader from '../components/ActionLoader';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordColor, setPasswordColor] = useState('#ef4444');
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const getPasswordStrength = (value) => {
    let strength = 0;
    if (value.length >= 8) strength += 1;
    if (/[A-Z]/.test(value)) strength += 1;
    if (/[0-9]/.test(value)) strength += 1;
    if (/[^A-Za-z0-9]/.test(value)) strength += 1;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setPassword(value);

    const strength = getPasswordStrength(value);
    setPasswordStrength(strength);

    if (value.length === 0) {
      setPasswordFeedback('');
      setPasswordColor('#ef4444');
      return;
    }

    if (strength <= 1) {
      setPasswordFeedback('Weak password');
      setPasswordColor('#ef4444');
    } else if (strength === 2) {
      setPasswordFeedback('Fair password');
      setPasswordColor('#f59e0b');
    } else if (strength === 3) {
      setPasswordFeedback('Good password');
      setPasswordColor('#3b82f6');
    } else {
      setPasswordFeedback('Strong password');
      setPasswordColor('#10b981');
    }
  };

  const validateSignup = () => {
    if (!email.includes('@')) {
      setError('Email must contain @');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateSignup()) {
      return;
    }

    setSubmitting(true);

    const result = await signup(name, email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/login', { state: { signupSuccess: true, from: location.state?.from } });
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '1rem',
    }}>
      <div className="glass-panel-glow fade-in" style={{
        width: '100%',
        maxWidth: '440px',
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
          Create Account
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Join TicketGlow to reserve tickets instantly.
        </p>

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
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="••••••••"
              required
            />
            {password && (
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{
                  height: '8px',
                  width: '100%',
                  background: '#374151',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength / 4) * 100}%`,
                    background: passwordColor,
                    transition: 'width 0.2s ease, background 0.2s ease'
                  }} />
                </div>
                <div style={{
                  marginTop: '0.4rem',
                  fontSize: '0.8rem',
                  color: passwordColor
                }}>
                  {passwordFeedback}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={submitting}
          >
            {submitting ? <ActionLoader label="Creating account..." /> : 'Create Account'}
          </button>
        </form>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
