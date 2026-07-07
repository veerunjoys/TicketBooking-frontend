import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Mail, Phone, MapPin } from 'lucide-react';

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    path: 'M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.16.5.5.9 1.1 1.16 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.16 1.77 4.9 4.9 0 0 1-1.77 1.16c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.16-1.77.5-.5 1.1-.9 1.77-1.16.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.27A3.27 3.27 0 1 1 12 8.73a3.27 3.27 0 0 1 0 6.54Zm5.2-8.46a1.17 1.17 0 1 1 0-2.34 1.17 1.17 0 0 1 0 2.34Z',
  },
  {
    label: 'X',
    href: 'https://x.com',
    path: 'M18.24 2.75h3.3l-7.2 8.23 8.47 11.27h-6.63l-5.2-6.8-5.94 6.8H1.72l7.7-8.8L1.3 2.75h6.8l4.7 6.22 5.44-6.22Zm-1.16 17.5h1.83L7.02 4.63H5.06L17.08 20.25Z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    path: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.6 15.6V8.4l6.24 3.6-6.24 3.6Z',
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: '#0b1120',
      color: 'rgba(255, 255, 255, 0.72)',
      marginTop: '3rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 1.5rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
      }}>
        {/* Brand column */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '1.3rem',
            color: '#fff',
            marginBottom: '0.75rem',
          }}>
            <Ticket size={22} style={{ color: 'var(--accent-cyan)' }} />
            TicketGlow
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Your one-stop destination to discover events and book tickets in seconds.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--gradient-main)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Explore column */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '1rem' }}>Explore</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem' }}>Events</Link>
            <Link to="/bookings" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem' }}>My Bookings</Link>
            <Link to="/wallet" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem' }}>Wallet</Link>
          </div>
        </div>

        {/* Company column */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '1rem' }}>Company</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem' }}>About Us</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem' }}>Careers</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem' }}>Terms & Conditions</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem' }}>Privacy Policy</a>
          </div>
        </div>

        {/* Contact column */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '1rem' }}>Contact Us</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={15} />
              support@ticketglow.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={15} />
              +91 98765 43210
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={15} />
              Hyderabad, India
            </div>
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
      }}>
        © {year} TicketGlow. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
