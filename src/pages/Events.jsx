import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { MapPin, Calendar, Ticket, ExternalLink } from 'lucide-react';
import ActionLoader from '../components/ActionLoader';
import { EventGridSkeleton } from '../components/Skeleton';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingEventId, setOpeningEventId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsResponse, bannerResponse] = await Promise.all([
          API.get('/events'),
          API.get('/events/banner'),
        ]);
        setEvents(eventsResponse.data);
        setBanner(bannerResponse.data);
      } catch (err) {
        setError('Failed to load events. Please check server connection.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBookSeats = (eventId) => {
    setOpeningEventId(eventId);
    navigate(`/events/${eventId}/seats`);
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Explore Events
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Checking currently available shows and events.
          </p>
        </div>
        <EventGridSkeleton />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Explore Events
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Secure seats for the most exclusive concerts, conferences, and sports.
        </p>
      </div>

      {banner?.isActive && (banner.title || banner.subtitle || banner.imageUrl) && (
        <a
          href={banner.linkUrl || undefined}
          target={banner.linkUrl ? '_blank' : undefined}
          rel={banner.linkUrl ? 'noreferrer' : undefined}
          className="ad-banner"
          style={{
            display: 'block',
            position: 'relative',
            minHeight: '180px',
            borderRadius: '18px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            marginBottom: '2rem',
            color: '#fff',
            textDecoration: 'none',
            background: banner.imageUrl ? '#0f172a' : 'var(--gradient-main)',
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.14)'
          }}
        >
          {banner.imageUrl && (
            <img
              src={banner.imageUrl}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: banner.imageUrl
              ? 'linear-gradient(90deg, rgba(15,23,42,0.82), rgba(15,23,42,0.28))'
              : 'linear-gradient(90deg, rgba(15,23,42,0.18), rgba(15,23,42,0.02))'
          }} />
          <div style={{
            position: 'relative',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '680px',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, opacity: 0.82, marginBottom: '0.5rem' }}>
              Sponsored
            </div>
            {banner.title && (
              <h2 style={{ fontSize: '1.65rem', lineHeight: 1.15, marginBottom: '0.55rem' }}>
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p style={{ fontSize: '0.98rem', lineHeight: 1.55, opacity: 0.9 }}>
                {banner.subtitle}
              </p>
            )}
            {banner.linkUrl && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem', fontWeight: 700, fontSize: '0.9rem' }}>
                Open offer <ExternalLink size={15} />
              </span>
            )}
          </div>
        </a>
      )}

      {error && (
        <div className="glass-panel" style={{
          padding: '2rem',
          textAlign: 'center',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Ticket size={48} style={{ strokeWidth: 1.5, marginBottom: '1.5rem', color: 'var(--text-muted)' }} />
          <h3>No Active Events Available</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Check back later or check admin settings to create events.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem',
          paddingBottom: '3rem'
        }}>
          {events.map((event) => (
            <div
              key={event._id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '1.75rem',
                height: '100%',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.25)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 242, 254, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '1.25rem',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(20,184,166,0.18))',
                border: '1px solid var(--border-color)'
              }}>
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                    <Ticket size={42} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: '#fff'
              }}>
                {event.title}
              </h3>
              
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
                marginBottom: '1.5rem',
                flex: '1'
              }}>
                {event.description}
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '1.75rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: 'var(--accent-cyan)' }} />
                  <span>{event.venue}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span>{formatDate(event.dateTime)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleBookSeats(event._id)}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={Boolean(openingEventId)}
              >
                {openingEventId === event._id ? (
                  <ActionLoader label="Opening seats..." />
                ) : (
                  <>
                    <Ticket size={18} />
                    Book Seats
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
