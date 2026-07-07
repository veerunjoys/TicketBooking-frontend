import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { WalletContext } from '../context/WalletContext';
import Timer from '../components/Timer';
import { Ticket, CreditCard, ChevronLeft, AlertCircle } from 'lucide-react';
import ActionLoader from '../components/ActionLoader';
import ProcessingOverlay from '../components/ProcessingOverlay';
import { SeatMapSkeleton } from '../components/Skeleton';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const reserveSteps = ['Checking seats', 'Creating 5 minute hold', 'Preparing checkout'];
const paymentSteps = ['Verifying reservation', 'Processing wallet payment', 'Issuing ticket'];

const createIdempotencyKey = (prefix) => {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const EventSeats = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState(location.state?.selectedSeatIds || []);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLabel, setActionLabel] = useState('');
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  
  // Hold state (after /reserve succeeds)
  const [activeBooking, setActiveBooking] = useState(null);
  const [activeHold, setActiveHold] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const claimingHoldRef = useRef(false);

  const { user, token } = useContext(AuthContext);
  const { balance, refreshBalance } = useContext(WalletContext);
  const holdStorageKey = `ticketHold:${eventId}`;

  const fetchEventAndSeats = async () => {
    try {
      const eventRes = await API.get('/events');
      const foundEvent = eventRes.data.find(e => e._id === eventId);
      setEvent(foundEvent);

      const seatsRes = await API.get(`/events/${eventId}/seats`);
      setSeats(seatsRes.data);
    } catch (err) {
      setError('Failed to fetch event seat details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndSeats();
  }, [eventId]);

  useEffect(() => {
    if (loading || activeBooking || activeHold) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const seatsRes = await API.get(`/events/${eventId}/seats`);
        setSeats(seatsRes.data);
      } catch (err) {
        console.error('Failed to poll seats:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [eventId, loading, activeBooking, activeHold]);

  useEffect(() => {
    const savedHold = sessionStorage.getItem(holdStorageKey);
    if (savedHold) {
      try {
        const parsedHold = JSON.parse(savedHold);
        if (parsedHold.eventId === eventId && new Date(parsedHold.reservationExpiresAt) > new Date()) {
          if (!activeHold) {
            setActiveHold(parsedHold);
            setSelectedSeatIds(parsedHold.seatIds);
          }
          return;
        }
      } catch (err) {
        console.error('Failed to parse saved seat hold:', err);
      }

      sessionStorage.removeItem(holdStorageKey);
    }

    if (!activeBooking && !activeHold && location.state?.selectedSeatIds?.length) {
      setSelectedSeatIds(location.state.selectedSeatIds);
    }
  }, [activeBooking, activeHold, eventId, holdStorageKey, location.state]);

  const claimGuestHold = async (hold) => {
    if (!hold || !user || !token || activeBooking || claimingHoldRef.current) {
      return;
    }

    claimingHoldRef.current = true;
    setSubmitting(true);
    setActionLabel('Restoring seat hold...');
    setProcessing({
      title: 'Restoring Hold',
      message: 'Finding the seats you selected before sign in.',
      steps: reserveSteps,
      activeStep: 0,
      done: false,
    });
    setError('');

    try {
      await wait(350);
      setProcessing({
        title: 'Restoring Hold',
        message: 'Linking your seat hold to this account.',
        steps: reserveSteps,
        activeStep: 1,
        done: false,
      });

      const reserveKey = createIdempotencyKey(`claim-${eventId}`);
      const response = await API.post('/bookings/reserve', {
        eventId,
        seatIds: hold.seatIds,
        holdToken: hold.holdToken,
      }, {
        headers: { 'Idempotency-Key': reserveKey }
      });

      const { booking } = response.data;
      setActiveBooking(booking);
      setActiveHold(null);
      sessionStorage.removeItem(holdStorageKey);
      setSelectedSeatIds(booking.seatIds);
      setIdempotencyKey(createIdempotencyKey(`confirm-${booking._id}`));

      const seatsRes = await API.get(`/events/${eventId}/seats`);
      setSeats(seatsRes.data);
      setProcessing({
        title: 'Hold Restored',
        message: 'Your seats are ready for payment.',
        steps: reserveSteps,
        activeStep: 2,
        done: true,
      });
      await wait(500);
    } catch (err) {
      setActiveHold(null);
      sessionStorage.removeItem(holdStorageKey);
      setSelectedSeatIds([]);
      setError(err.response?.data?.message || 'Your seat hold could not be restored. Please select seats again.');
      fetchEventAndSeats();
    } finally {
      claimingHoldRef.current = false;
      setSubmitting(false);
      setActionLabel('');
      setProcessing(null);
    }
  };

  useEffect(() => {
    if (user && token && activeHold && !activeBooking) {
      claimGuestHold(activeHold);
    }
  }, [user, token, activeHold, activeBooking]);

  const handleSeatClick = (seat) => {
    // If seat is booked, blocked, or reserved by someone else, ignore click
    if (seat.status === 'BOOKED' || seat.status === 'BLOCKED' || (seat.status === 'RESERVED' && !activeBooking && !activeHold)) {
      return;
    }

    // If we have an active hold, we cannot change seat selections without releasing first
    if (activeBooking || activeHold) {
      setError('Please pay for your current reserved seats or let the hold expire.');
      return;
    }

    if (selectedSeatIds.includes(seat._id)) {
      setSelectedSeatIds(selectedSeatIds.filter(id => id !== seat._id));
    } else {
      setSelectedSeatIds([...selectedSeatIds, seat._id]);
    }
    setError('');
  };

  const getSeatClass = (seat) => {
    if (seat.status === 'BOOKED') return 'seat-item booked';
    if (seat.status === 'BLOCKED') return 'seat-item blocked';
    if (selectedSeatIds.includes(seat._id)) return 'seat-item selecting';
    if (seat.status === 'RESERVED') return 'seat-item reserved';
    return 'seat-item available';
  };

  const handleReserve = async () => {
    if (selectedSeatIds.length === 0) {
      setError('Please select at least one seat.');
      return;
    }

    setSubmitting(true);
    setActionLabel(user && token ? 'Holding selected seats...' : 'Saving your seat hold...');
    setProcessing({
      title: user && token ? 'Reserving Seats' : 'Saving Seat Hold',
      message: 'Checking selected seats are still available.',
      steps: reserveSteps,
      activeStep: 0,
      done: false,
    });
    setError('');

    try {
      await wait(350);
      setProcessing({
        title: user && token ? 'Reserving Seats' : 'Saving Seat Hold',
        message: 'Creating your 5 minute seat hold.',
        steps: reserveSteps,
        activeStep: 1,
        done: false,
      });

      const reserveKey = createIdempotencyKey(`reserve-${eventId}`);
      const response = await API.post('/bookings/reserve', {
        eventId,
        seatIds: selectedSeatIds,
      }, {
        headers: { 'Idempotency-Key': reserveKey }
      });

      const { booking, hold } = response.data;
      if (hold) {
        setActiveHold(hold);
        setSelectedSeatIds(hold.seatIds);
        sessionStorage.setItem(holdStorageKey, JSON.stringify(hold));
        navigate('/login', { state: { from: returnToSeatPage } });
        return;
      }

      setActiveBooking(booking);
      
      // Generate a new idempotency key for this confirmation attempt
      const randomKey = createIdempotencyKey(`confirm-${booking._id}`);
      setIdempotencyKey(randomKey);

      // Re-fetch seats to show updated reserved state
      const seatsRes = await API.get(`/events/${eventId}/seats`);
      setSeats(seatsRes.data);
      setProcessing({
        title: 'Seats Reserved',
        message: 'Your seats are held. Continue to payment.',
        steps: reserveSteps,
        activeStep: 2,
        done: true,
      });
      await wait(500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve seats. They may have been taken.');
      fetchEventAndSeats(); // reload to get fresh seats
    } finally {
      setSubmitting(false);
      setActionLabel('');
      setProcessing(null);
    }
  };

  const handlePayment = async () => {
    if (activeHold && (!user || !token)) {
      navigate('/login', { state: { from: returnToSeatPage } });
      return;
    }

    if (!activeBooking) return;

    if (!user || !token) {
      navigate('/login', { state: { from: returnToSeatPage } });
      return;
    }

    setSubmitting(true);
    setActionLabel('Processing payment...');
    setProcessing({
      title: 'Completing Booking',
      message: 'Verifying your active seat reservation.',
      steps: paymentSteps,
      activeStep: 0,
      done: false,
    });
    setError('');

    try {
      await wait(350);
      const confirmKey = idempotencyKey || createIdempotencyKey(`confirm-${activeBooking._id}`);
      if (!idempotencyKey) {
        setIdempotencyKey(confirmKey);
      }

      setProcessing({
        title: 'Completing Booking',
        message: 'Processing wallet payment securely.',
        steps: paymentSteps,
        activeStep: 1,
        done: false,
      });

      await API.post(`/bookings/${activeBooking._id}/confirm`, {}, {
        headers: { 'Idempotency-Key': confirmKey }
      });

      setProcessing({
        title: 'Booking Confirmed',
        message: 'Your ticket is confirmed and ready in bookings.',
        steps: paymentSteps,
        activeStep: 2,
        done: true,
      });
      // Payment successful, update state
      await refreshBalance();
      await wait(650);
      navigate('/bookings', { state: { message: 'Booking confirmed successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      
      // If payment failed, wallet status may have changed, let's refresh balance
      await refreshBalance();
      
      // If payment failed due to expired reservation, clear the active booking hold
      if (err.response?.status === 400 && err.response?.data?.message?.includes('expired')) {
        handleTimerExpire();
      }
    } finally {
      setSubmitting(false);
      setActionLabel('');
      setProcessing(null);
    }
  };

  const handleTimerExpire = () => {
    setActiveBooking(null);
    setActiveHold(null);
    setSelectedSeatIds([]);
    setIdempotencyKey('');
    sessionStorage.removeItem(holdStorageKey);
    setError('Your reservation hold has expired. Seats have been released.');
    fetchEventAndSeats(); // Reload available seats
  };

  const getSelectedSeatsPrice = () => {
    return seats
      .filter(s => selectedSeatIds.includes(s._id))
      .reduce((sum, s) => sum + s.price, 0);
  };

  const formatCurrency = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="fade-in">
        <SeatMapSkeleton />
      </div>
    );
  }

  const totalPrice = getSelectedSeatsPrice();
  const isBalanceSufficient = balance >= totalPrice;
  const returnToSeatPage = {
    pathname: location.pathname,
    state: { selectedSeatIds },
  };
  const currentHold = activeBooking || activeHold;

  return (
    <div className="fade-in" style={{ padding: '0 1.5rem', pb: '4rem' }}>
      <ProcessingOverlay
        open={Boolean(processing)}
        title={processing?.title}
        message={processing?.message}
        steps={processing?.steps}
        activeStep={processing?.activeStep || 0}
        done={processing?.done}
      />

      <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>
        <ChevronLeft size={16} />
        Back to Events
      </button>

      {event && (
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{event.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            📍 {event.venue} &nbsp;•&nbsp; 📅 {new Date(event.dateTime).toLocaleString('en-IN')}
          </p>
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
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gap: '2.5rem',
        alignItems: 'start'
      }}>
        {/* Left Side: Seat Layout Map */}
        <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Screen boundary marker */}
          <div style={{
            width: '80%',
            height: '8px',
            background: 'var(--gradient-main)',
            borderRadius: '50% / 0 0 100% 100%',
            marginBottom: '1rem',
            opacity: 0.8,
            boxShadow: '0 4px 20px rgba(0, 242, 254, 0.4)'
          }} />
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '3rem'
          }}>
            Stage / Screen
          </div>

          {/* Seat Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 40px)',
            gap: '0.75rem',
            justifyContent: 'center',
            marginBottom: '3rem'
          }}>
            {seats.map((seat) => (
              <button
                key={seat._id}
                className={getSeatClass(seat)}
                onClick={() => handleSeatClick(seat)}
                disabled={seat.status === 'BOOKED' || seat.status === 'BLOCKED' || (seat.status === 'RESERVED' && !currentHold)}
              >
                {seat.seatNumber}
              </button>
            ))}
          </div>

          {/* Legends */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.5rem',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="seat-item available" style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'default' }} />
              <span>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="seat-item selecting" style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'default', animation: 'none' }} />
              <span>Selected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="seat-item reserved" style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'default', animation: 'none' }} />
              <span>Reserved</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="seat-item blocked" style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'default' }} />
              <span>Blocked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div className="seat-item booked" style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'default' }} />
              <span>Sold Out</span>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary Panel */}
        <div className="glass-panel-glow" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Summary</h3>

          {/* Reserved Hold Info */}
          {currentHold && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Seats Held Successfully
              </div>
              <Timer
                expiresAt={currentHold.reservationExpiresAt}
                onExpire={handleTimerExpire}
              />
            </div>
          )}

          {/* Seat breakdown */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Selected Seats:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {selectedSeatIds.length > 0
                  ? seats.filter(s => selectedSeatIds.includes(s._id)).map(s => s.seatNumber).join(', ')
                  : 'None'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Unit Price:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {selectedSeatIds.length > 0
                  ? formatCurrency(seats.find(s => selectedSeatIds.includes(s._id)).price)
                  : '₹0.00'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-color)',
              marginTop: '1.25rem',
              paddingTop: '1.25rem'
            }}>
              <span style={{ fontWeight: 700 }}>Total Amount:</span>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--accent-cyan)'
              }} className="text-glow">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>

          {/* Balance Warning */}
          {user && token && selectedSeatIds.length > 0 && !isBalanceSufficient && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '0.85rem',
              color: '#f87171',
              fontSize: '0.8rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                ⚠️ Insufficient Funds
              </div>
              <div>
                Your balance is {formatCurrency(balance)}. You need {formatCurrency(totalPrice - balance)} more. 
                Please top up your wallet to continue.
              </div>
            </div>
          )}

          {/* Action button */}
          {!currentHold ? (
            <button
              onClick={handleReserve}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            disabled={selectedSeatIds.length === 0 || submitting}
          >
              {submitting ? (
                <ActionLoader label={actionLabel || 'Holding seats...'} />
              ) : (
                <>
                  <Ticket size={18} />
                  Reserve Seats (5 min hold)
                </>
              )}
            </button>
          ) : activeHold && (!user || !token) ? (
            <button
              onClick={() => navigate('/login', { state: { from: returnToSeatPage } })}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <ActionLoader label={actionLabel || 'Restoring hold...'} />
              ) : (
                <>
                  <Ticket size={18} />
                  Sign In to Continue
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handlePayment}
              className="btn btn-primary animate-pulse"
              style={{
                width: '100%',
                padding: '0.85rem',
                background: 'var(--gradient-pink)',
                boxShadow: '0 4px 15px rgba(255, 0, 127, 0.3)'
              }}
              disabled={!isBalanceSufficient || submitting}
            >
              {submitting ? (
                <ActionLoader label={actionLabel || 'Processing payment...'} />
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay Now
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventSeats;
