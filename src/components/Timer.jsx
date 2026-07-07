import React, { useState, useEffect } from 'react';

const Timer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    // Initialize immediately
    setTimeLeft(calculateTimeLeft());

    const intervalId = setInterval(() => {
      const secondsLeft = calculateTimeLeft();
      setTimeLeft(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(intervalId);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, onExpire]);

  if (timeLeft <= 0) {
    return <span style={{ color: '#f87171', fontWeight: 700 }}>EXPIRED</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      padding: '0.4rem 0.8rem',
      borderRadius: '8px',
      color: '#f87171',
      fontWeight: 700,
      fontFamily: 'monospace',
      fontSize: '0.95rem'
    }}>
      ⏱️ {formattedTime}
    </div>
  );
};

export default Timer;
