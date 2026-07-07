import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';

// Components & Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import Events from './pages/Events';
import EventSeats from './pages/EventSeats';
import Bookings from './pages/Bookings';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return user.role === 'admin' ? <Navigate to="/admin" replace /> : children;
};

const AdminRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return user.role === 'admin'
    ? children
    : <Navigate to="/admin/login" replace state={{ adminOnly: true }} />;
};

const PublicRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  if (!user || !token) {
    return children;
  }

  return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
};

const AdminLoginRoute = () => {
  const { user, token } = useContext(AuthContext);

  if (user?.role === 'admin' && token) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminLogin />;
};

function AppContent() {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const showNavbar = user && token && (!isAdminArea || user.role === 'admin');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showNavbar && <Navbar />}
      <div style={{
        flex: 1,
        maxWidth: isAdminArea ? 'none' : '1200px',
        width: '100%',
        margin: '0 auto',
        padding: isAdminArea ? 0 : '1rem 0',
      }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Protected Event Route */}
          <Route path="/" element={<ProtectedRoute><Events /></ProtectedRoute>} />

          {/* Protected Seat Selection Route */}
          <Route path="/events/:id/seats" element={<ProtectedRoute><EventSeats /></ProtectedRoute>} />

          {/* Protected User Routes */}
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />

          {/* Protected Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginRoute />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/*" element={<AdminRoute><Admin /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isAdminArea && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
