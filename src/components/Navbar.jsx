import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { WalletContext } from '../context/WalletContext';
import { LogOut, Wallet as WalletIcon, Calendar, User, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { balance } = useContext(WalletContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const logoutPath = user.role === 'admin' ? '/admin/login' : '/login';
    await logout();
    navigate(logoutPath);
  };

  const formatCurrency = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!user) return null;
  const isAdmin = user.role === 'admin';

  return (
    <nav className="glass-panel" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      borderRadius: '0 0 16px 16px',
      marginBottom: '2rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to={isAdmin ? '/admin' : '/'} style={{
          textDecoration: 'none',
          color: 'var(--accent-cyan)',
          fontWeight: 800,
          fontSize: '1.5rem',
          letterSpacing: '-0.5px'
        }} className="text-glow">
          🎫 TicketGlow
        </Link>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          {isAdmin ? (
            <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderColor: 'rgba(127, 0, 255, 0.3)' }}>
              <LayoutDashboard size={16} style={{ color: 'var(--accent-purple)' }} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                <Calendar size={16} />
                Events
              </Link>
              <Link to="/bookings" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                <User size={16} />
                My Bookings
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Wallet Display */}
        {!isAdmin && (
          <Link to="/wallet" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          padding: '0.5rem 1.25rem',
          borderRadius: '10px',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.3s ease'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-cyan)';
          e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          <WalletIcon size={18} style={{ color: 'var(--accent-cyan)' }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wallet Balance</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{formatCurrency(balance)}</div>
          </div>
          </Link>
        )}

        {/* User Info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.6rem', minWidth: 'auto', display: 'flex', alignItems: 'center' }}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
