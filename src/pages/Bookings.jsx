import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api';
import { Calendar, MapPin, Trash2, Ticket, CheckCircle } from 'lucide-react';
import ActionLoader from '../components/ActionLoader';
import { BookingListSkeleton } from '../components/Skeleton';

const createIdempotencyKey = (prefix) => {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const response = await API.get(`/bookings/my?page=${page}&limit=20`);
      setBookings(response.data.data ?? response.data);
      if (response.data.pagination) setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to fetch bookings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? You will receive a full refund to your wallet.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setCancellingId(bookingId);
      const response = await API.post(`/bookings/${bookingId}/cancel`, {}, {
        headers: { 'Idempotency-Key': createIdempotencyKey(`cancel-${bookingId}`) },
      });
      setSuccess(response.data.message);
      await fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId('');
    }
  };

  const getStatusBadgeClass = (status) => {
    return `status-badge ${status.toLowerCase()}`;
  };

  const formatCurrency = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const isEventPassed = (eventDateString) => {
    return new Date() >= new Date(eventDateString);
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '0 1.5rem', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            My Bookings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Loading your ticket history.
          </p>
        </div>
        <BookingListSkeleton />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '0 1.5rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          My Bookings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Track and manage your reserved and confirmed tickets.
        </p>
      </div>

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          fontSize: '0.9rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Ticket size={48} style={{ strokeWidth: 1.5, marginBottom: '1.5rem' }} />
          <h3>No Bookings Found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>You haven't booked any event tickets yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bookings.map((booking) => (
            <div key={booking._id} className="glass-panel" style={{
              padding: '1.75rem',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: '2rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <span className={getStatusBadgeClass(booking.status)}>
                    {booking.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ID: {booking._id}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fff' }}>
                  {booking.eventId?.title || 'Unknown Event'}
                </h3>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem'
                }}>
                  {booking.eventId && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={16} style={{ color: 'var(--accent-cyan)' }} />
                        <span>{booking.eventId.venue}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={16} style={{ color: 'var(--accent-purple)' }} />
                        <span>{new Date(booking.eventId.dateTime).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Seats Selected: </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {booking.seatIds.map(s => s.seatNumber).join(', ')}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Paid</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {formatCurrency(booking.amount)}
                  </div>
                </div>

                {booking.status === 'CONFIRMED' && booking.eventId && !isEventPassed(booking.eventId.dateTime) && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    disabled={Boolean(cancellingId)}
                  >
                    {cancellingId === booking._id ? (
                      <ActionLoader label="Cancelling..." />
                    ) : (
                      <>
                        <Trash2 size={15} />
                        Cancel Booking
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            className="btn btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => fetchBookings(pagination.page - 1)}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            ← Previous
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Page <strong style={{ color: '#fff' }}>{pagination.page}</strong> of <strong style={{ color: '#fff' }}>{pagination.pages}</strong>
            <span style={{ marginLeft: '0.75rem', opacity: 0.6 }}>({pagination.total} total)</span>
          </span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page >= pagination.pages}
            onClick={() => fetchBookings(pagination.page + 1)}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Bookings;
