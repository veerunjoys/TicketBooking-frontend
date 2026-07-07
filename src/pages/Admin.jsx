import React, { useState, useEffect } from 'react';
import API, { createIdempotencyKey } from '../api';
import { Calendar, Trash2, Shield, Plus, Table, BookOpen, AlertCircle, CheckCircle, Ticket, Image, Megaphone, BarChart2, Lock, Unlock, TrendingUp } from 'lucide-react';
import ActionLoader from '../components/ActionLoader';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview | events | bookings | transactions
  
  // Stats state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    bookingsCount: 0,
    confirmedCount: 0,
    pendingCount: 0,
    totalSeats: 0,
    bookedSeats: 0,
    blockedSeats: 0,
    activeHolds: 0,
    occupancyRate: 0,
  });

  // Seat management state
  const [selectedEventForSeats, setSelectedEventForSeats] = useState(null);
  const [eventSeats, setEventSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  
  // Events state
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bulkPrice, setBulkPrice] = useState('500');
  const [bulkCount, setBulkCount] = useState('30');
  const [banner, setBanner] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    isActive: true,
  });
  
  // Bookings & Transactions state
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeAction, setActiveAction] = useState(null);

  const isWorking = Boolean(activeAction);
  const isAction = (type, id) => activeAction?.type === type && (!id || activeAction?.id === id);

  const fetchEvents = async () => {
    try {
      const response = await API.get('/events');
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/admin/stats/overview');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchEventSeats = async (eventId) => {
    setLoadingSeats(true);
    try {
      const response = await API.get(`/admin/events/${eventId}/seats`);
      setEventSeats(response.data);
    } catch (err) {
      console.error('Failed to load seats:', err);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleToggleSeatBlock = async (seatId) => {
    try {
      setError('');
      setSuccess('');
      setActiveAction({ type: 'toggleBlock', id: seatId, label: 'Toggling seat block...' });
      const response = await API.patch(`/admin/seats/${seatId}/block`, {}, {
        headers: { 'Idempotency-Key': createIdempotencyKey(`admin-block-${seatId}`) }
      });
      setSuccess(response.data.message);
      if (selectedEventForSeats) {
        await fetchEventSeats(selectedEventForSeats._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle seat block.');
    } finally {
      setActiveAction(null);
    }
  };

  const fetchBanner = async () => {
    try {
      const response = await API.get('/admin/banner');
      setBanner({
        title: response.data?.title || '',
        subtitle: response.data?.subtitle || '',
        imageUrl: response.data?.imageUrl || '',
        linkUrl: response.data?.linkUrl || '',
        isActive: response.data?.isActive !== false,
      });
    } catch (err) {
      console.error('Failed to load banner:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await API.get('/admin/bookings');
      setBookings(response.data.data ?? response.data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await API.get('/admin/transactions');
      setTransactions(response.data.data ?? response.data);
    } catch (err) {
      console.error('Failed to load transaction logs:', err);
    }
  };

  const loadTabData = async (tab) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (tab === 'overview') await fetchStats();
      if (tab === 'events') {
        await Promise.all([fetchEvents(), fetchBanner()]);
      }
      if (tab === 'bookings') await fetchBookings();
      if (tab === 'transactions') await fetchTransactions();
    } catch {
      setError('Failed to fetch data for tab.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActiveAction({ type: 'createEvent', label: 'Creating event...' });

    try {
      await API.post('/admin/events', {
        title,
        description,
        venue,
        dateTime,
        imageUrl,
      }, {
        headers: { 'Idempotency-Key': createIdempotencyKey('admin-event') }
      });

      setSuccess('Event created successfully.');
      setTitle('');
      setDescription('');
      setVenue('');
      setDateTime('');
      setImageUrl('');
      await fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleEventImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Please choose an image smaller than 3 MB.');
      return;
    }

    try {
      setImageUrl(await readFileAsDataUrl(file));
      setError('');
    } catch {
      setError('Failed to read event image.');
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid banner image file.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Please choose a banner image smaller than 3 MB.');
      return;
    }

    try {
      const nextImageUrl = await readFileAsDataUrl(file);
      setBanner((current) => ({ ...current, imageUrl: nextImageUrl }));
      setError('');
    } catch {
      setError('Failed to read banner image.');
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActiveAction({ type: 'saveBanner', label: 'Saving banner...' });

    try {
      const response = await API.put('/admin/banner', banner, {
        headers: { 'Idempotency-Key': createIdempotencyKey('admin-banner') }
      });
      setBanner({
        title: response.data.banner?.title || '',
        subtitle: response.data.banner?.subtitle || '',
        imageUrl: response.data.banner?.imageUrl || '',
        linkUrl: response.data.banner?.linkUrl || '',
        isActive: response.data.banner?.isActive !== false,
      });
      setSuccess('Banner updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update banner.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this event? This will not auto-refund users. Use Bookings tab to issue manual refunds.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setActiveAction({ type: 'cancelEvent', id: eventId, label: 'Cancelling event...' });
      await API.delete(`/admin/events/${eventId}`, {
        headers: { 'Idempotency-Key': createIdempotencyKey(`admin-cancel-${eventId}`) }
      });
      setSuccess('Event marked as CANCELLED.');
      await fetchEvents();
    } catch {
      setError('Failed to cancel event.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleBulkBuildSeats = async (eventId) => {
    const priceINR = parseFloat(bulkPrice);
    const count = parseInt(bulkCount);

    if (isNaN(priceINR) || priceINR <= 0 || isNaN(count) || count <= 0) {
      setError('Please provide a valid price and seat count.');
      return;
    }

    setError('');
    setSuccess('');
    setActiveAction({ type: 'bulkSeats', id: eventId, label: 'Generating seats...' });

    // Build seats array e.g. A1 to A30
    const seats = [];
    for (let i = 1; i <= count; i++) {
      seats.push({
        seatNumber: `S${i}`,
        price: Math.round(priceINR * 100), // paise
      });
    }

    try {
      const response = await API.post(`/admin/events/${eventId}/seats/bulk`, { seats }, {
        headers: { 'Idempotency-Key': createIdempotencyKey(`admin-seats-${eventId}`) }
      });
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate bulk seats.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleAdminRefund = async (bookingId) => {
    if (!window.confirm('Are you sure you want to refund this booking? This will credit the full amount to the user\'s wallet and release the seats.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      setActiveAction({ type: 'refund', id: bookingId, label: 'Issuing refund...' });
      const response = await API.post(`/admin/bookings/${bookingId}/refund`, {}, {
        headers: { 'Idempotency-Key': createIdempotencyKey(`admin-refund-${bookingId}`) }
      });
      setSuccess(response.data.message);
      await fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue refund.');
    } finally {
      setActiveAction(null);
    }
  };

  const formatCurrency = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="fade-in" style={{ padding: '0 1.5rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Shield size={32} style={{ color: 'var(--accent-purple)' }} />
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Manage events, issue refunds, and audit system transactions.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BarChart2 size={18} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Calendar size={18} />
          Events Manager
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Table size={18} />
          Bookings Log
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`btn ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BookOpen size={18} />
          Transaction Audit
        </button>
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
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {activeAction && (
        <div className="glass-panel action-progress" style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          color: 'var(--text-muted)'
        }}>
          <ActionLoader label={activeAction.label} />
        </div>
      )}

      {/* Tab: Overview Dashboard */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Total Revenue', value: `₹${(stats.totalRevenue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <TrendingUp size={22} />, color: '#34d399' },
              { label: 'Total Bookings', value: stats.bookingsCount, icon: <Ticket size={22} />, color: 'var(--accent-cyan)' },
              { label: 'Confirmed', value: stats.confirmedCount, icon: <CheckCircle size={22} />, color: '#34d399' },
              { label: 'Active Holds', value: stats.activeHolds, icon: <Calendar size={22} />, color: '#fbbf24' },
              { label: 'Occupancy', value: `${stats.occupancyRate}%`, icon: <BarChart2 size={22} />, color: 'var(--accent-purple)' },
              { label: 'Blocked Seats', value: stats.blockedSeats, icon: <Lock size={22} />, color: '#f87171' },
            ].map((card) => (
              <div key={card.label} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: card.color, background: `${card.color}18`, borderRadius: '10px', padding: '0.65rem', flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{loading ? '…' : card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Seat Map Manager */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} style={{ color: 'var(--accent-purple)' }} />
              Seat Map Manager
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                Click a seat to toggle block / unblock
              </span>
            </h3>

            {/* Event selector */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {events.length === 0 && (
                <button className="btn btn-secondary" onClick={fetchEvents} style={{ fontSize: '0.85rem' }}>
                  Load Events
                </button>
              )}
              {events.map((ev) => (
                <button
                  key={ev._id}
                  className={`btn ${selectedEventForSeats?._id === ev._id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  onClick={() => {
                    setSelectedEventForSeats(ev);
                    fetchEventSeats(ev._id);
                  }}
                >
                  {ev.title}
                </button>
              ))}
            </div>

            {selectedEventForSeats && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Seat map for <strong style={{ color: 'var(--text-main)' }}>{selectedEventForSeats.title}</strong> — Click any available or blocked seat to toggle its block state.
                </p>

                {loadingSeats ? (
                  <ActionLoader label="Loading seats..." block />
                ) : eventSeats.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    No seats found for this event.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 52px)', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                      {eventSeats.map((seat) => {
                        const isBooked = seat.status === 'BOOKED';
                        const isBlocked = seat.status === 'BLOCKED';
                        const isReserved = seat.status === 'RESERVED';
                        const canToggle = !isBooked && !isReserved;

                        return (
                          <button
                            key={seat._id}
                            onClick={() => canToggle && handleToggleSeatBlock(seat._id)}
                            disabled={!canToggle || isWorking}
                            title={isBooked ? 'Booked — cannot block' : isReserved ? 'Has active hold — cannot block' : isBlocked ? 'Click to unblock' : 'Click to block'}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              border: isBlocked ? '1.5px dashed rgba(75,85,99,0.55)' : isBooked ? '1.5px solid #cbd5e1' : isReserved ? '1.5px solid rgba(245,158,11,0.45)' : '1.5px solid rgba(16,185,129,0.35)',
                              background: isBlocked ? 'rgba(75,85,99,0.12)' : isBooked ? '#e2e8f0' : isReserved ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.10)',
                              color: isBlocked ? '#9ca3af' : isBooked ? '#64748b' : isReserved ? '#d97706' : '#059669',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: canToggle ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px',
                              opacity: isBooked ? 0.7 : 1,
                              transition: 'all 0.18s',
                            }}
                          >
                            <span style={{ fontSize: '0.65rem' }}>{seat.seatNumber}</span>
                            {isBlocked && <Lock size={10} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap', justifyContent: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      {[
                        { label: 'Available', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', color: '#059669' },
                        { label: 'Reserved', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.45)', color: '#d97706' },
                        { label: 'Booked', bg: '#e2e8f0', border: '#cbd5e1', color: '#64748b' },
                        { label: 'Blocked', bg: 'rgba(75,85,99,0.12)', border: 'rgba(75,85,99,0.55)', color: '#9ca3af' },
                      ].map((item) => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: item.bg, border: `1.5px dashed ${item.border}` }} />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Events Manager */}
      {activeTab === 'events' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '2.5rem',
          alignItems: 'start'
        }}>
          {/* Create Event Panel */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} style={{ color: 'var(--accent-cyan)' }} />
              Create Event
            </h3>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., EDM Party Night"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the event details..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Venue Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="E.g., Stadium Hall"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Event Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Event Image</label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*"
                  onChange={handleEventImageUpload}
                />
              </div>
              {imageUrl && (
                <div style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1.25rem',
                  background: '#eef4ff'
                }}>
                  <img
                    src={imageUrl}
                    alt="Event preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isWorking}
              >
                {isAction('createEvent') ? <ActionLoader label="Creating event..." /> : 'Create Event'}
              </button>
            </form>
          </div>

          {/* Events list and bulk seat generator */}
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
            <form onSubmit={handleSaveBanner} style={{
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              background: 'rgba(255,255,255,0.45)'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} style={{ color: 'var(--accent-orange)' }} />
                Top Ad Banner
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Banner Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={banner.title}
                    onChange={(e) => setBanner((current) => ({ ...current, title: e.target.value }))}
                    placeholder="Weekend mega sale"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ad Link</label>
                  <input
                    type="url"
                    className="form-input"
                    value={banner.linkUrl}
                    onChange={(e) => setBanner((current) => ({ ...current, linkUrl: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Banner Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={banner.subtitle}
                  onChange={(e) => setBanner((current) => ({ ...current, subtitle: e.target.value }))}
                  placeholder="Promote a show, sponsor, or limited offer"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Banner Image</label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/*"
                    onChange={handleBannerImageUpload}
                  />
                </div>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  paddingBottom: '0.8rem'
                }}>
                  <input
                    type="checkbox"
                    checked={banner.isActive}
                    onChange={(e) => setBanner((current) => ({ ...current, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
              {banner.imageUrl && (
                <div style={{
                  width: '100%',
                  aspectRatio: '5 / 1',
                  minHeight: '110px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  marginTop: '1rem',
                  marginBottom: '1rem',
                  background: '#eef4ff'
                }}>
                  <img
                    src={banner.imageUrl}
                    alt="Ad banner preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isWorking}
              >
                {isAction('saveBanner') ? <ActionLoader label="Saving banner..." /> : (
                  <>
                    <Image size={16} />
                    Save Banner
                  </>
                )}
              </button>
            </form>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Active Events</h3>
            {loading ? (
              <ActionLoader label="Loading events..." block />
            ) : events.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
                No active events available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {events.map((event) => (
                  <div key={event._id} style={{
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        style={{
                          width: '92px',
                          height: '68px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          marginRight: '1rem',
                          flex: '0 0 auto'
                        }}
                      />
                    )}
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        {event.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        📍 {event.venue} &nbsp;•&nbsp; 📅 {new Date(event.dateTime).toLocaleString('en-IN')}
                      </p>
                      <span className={`status-badge ${event.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                        {event.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* Bulk Seat Generation Tool */}
                      {event.status === 'ACTIVE' && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '0.5rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <input
                                type="number"
                                className="form-input"
                                value={bulkCount}
                                onChange={(e) => setBulkCount(e.target.value)}
                                placeholder="Seats"
                                style={{ width: '65px', padding: '0.25rem', fontSize: '0.8rem', textAlign: 'center' }}
                              />
                              <input
                                type="number"
                                className="form-input"
                                value={bulkPrice}
                                onChange={(e) => setBulkPrice(e.target.value)}
                                placeholder="Price"
                                style={{ width: '65px', padding: '0.25rem', fontSize: '0.8rem', textAlign: 'center' }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleBulkBuildSeats(event._id)}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            disabled={isWorking}
                          >
                            {isAction('bulkSeats', event._id) ? (
                              <ActionLoader label="Generating..." />
                            ) : (
                              <>
                                <Ticket size={14} />
                                Gen Seats
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {event.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancelEvent(event._id)}
                          className="btn btn-danger"
                          style={{ padding: '0.5rem', minWidth: 'auto' }}
                          disabled={isWorking}
                        >
                          {isAction('cancelEvent', event._id) ? <ActionLoader label="Cancelling..." /> : <Trash2 size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Bookings Log */}
      {activeTab === 'bookings' && (
        <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Bookings Monitoring</h3>

          {loading ? (
            <ActionLoader label="Loading bookings log..." block />
          ) : bookings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
              No bookings recorded.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem' }}>Booking ID</th>
                    <th style={{ padding: '0.85rem' }}>Customer</th>
                    <th style={{ padding: '0.85rem' }}>Event</th>
                    <th style={{ padding: '0.85rem' }}>Seats</th>
                    <th style={{ padding: '0.85rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem' }}>Status</th>
                    <th style={{ padding: '0.85rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1rem 0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {booking._id.substring(0, 10)}...
                      </td>
                      <td style={{ padding: '1rem 0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>{booking.userId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.userId?.email}</div>
                      </td>
                      <td style={{ padding: '1rem 0.85rem' }}>
                        {booking.eventId?.title || 'Unknown Event'}
                      </td>
                      <td style={{ padding: '1rem 0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {booking.seatIds.map(s => s.seatNumber).join(', ')}
                      </td>
                      <td style={{ padding: '1rem 0.85rem', fontWeight: 600 }}>
                        {formatCurrency(booking.amount)}
                      </td>
                      <td style={{ padding: '1rem 0.85rem' }}>
                        <span className={`status-badge ${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.85rem', textAlign: 'right' }}>
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleAdminRefund(booking._id)}
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            disabled={isWorking}
                          >
                            {isAction('refund', booking._id) ? <ActionLoader label="Refunding..." /> : 'Force Refund'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Transaction Audit */}
      {activeTab === 'transactions' && (
        <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>System Ledger Audit Trail</h3>

          {loading ? (
            <ActionLoader label="Loading audit log..." block />
          ) : transactions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
              No transactions recorded in system.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem' }}>Timestamp</th>
                    <th style={{ padding: '0.85rem' }}>Customer</th>
                    <th style={{ padding: '0.85rem' }}>Type</th>
                    <th style={{ padding: '0.85rem' }}>Amount</th>
                    <th style={{ padding: '0.85rem' }}>Reference Type</th>
                    <th style={{ padding: '0.85rem' }}>Balance After</th>
                    <th style={{ padding: '0.85rem' }}>Key</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1rem 0.85rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(tx.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1rem 0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>{tx.userId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.userId?.email}</div>
                      </td>
                      <td style={{
                        padding: '1rem 0.85rem',
                        fontWeight: 700,
                        color: tx.type === 'CREDIT' || tx.type === 'REFUND' ? '#34d399' : '#f87171'
                      }}>{tx.type}</td>
                      <td style={{ padding: '1rem 0.85rem', fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                      <td style={{ padding: '1rem 0.85rem', color: 'var(--text-muted)' }}>{tx.referenceType}</td>
                      <td style={{ padding: '1rem 0.85rem', color: 'var(--text-muted)' }}>{formatCurrency(tx.balanceAfter)}</td>
                      <td style={{ padding: '1rem 0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {tx.idempotencyKey ? `${tx.idempotencyKey.substring(0, 15)}...` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
