import React from 'react';

const SkeletonLine = ({ width = '100%', height = 12, style = {} }) => (
  <div
    className="skeleton-line"
    style={{ width, height, ...style }}
  />
);

export const EventGridSkeleton = ({ count = 6 }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, index) => (
      <div className="glass-panel skeleton-card" key={index}>
        <SkeletonLine width="62%" height={22} />
        <SkeletonLine width="100%" />
        <SkeletonLine width="86%" />
        <div className="skeleton-divider" />
        <SkeletonLine width="72%" />
        <SkeletonLine width="56%" />
        <SkeletonLine width="100%" height={42} style={{ borderRadius: 10, marginTop: '1rem' }} />
      </div>
    ))}
  </div>
);

export const SeatMapSkeleton = () => (
  <div className="seat-loading-layout">
    <div className="glass-panel skeleton-seat-panel">
      <SkeletonLine width="80%" height={8} style={{ borderRadius: 999, marginBottom: '3.2rem' }} />
      <div className="skeleton-seat-grid">
        {Array.from({ length: 60 }).map((_, index) => (
          <span className="skeleton-seat" key={index} />
        ))}
      </div>
    </div>
    <div className="glass-panel-glow skeleton-summary">
      <SkeletonLine width="44%" height={20} />
      <SkeletonLine width="90%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="100%" height={1} />
      <SkeletonLine width="64%" height={28} />
      <SkeletonLine width="100%" height={42} style={{ borderRadius: 10 }} />
    </div>
  </div>
);

export const BookingListSkeleton = ({ count = 4 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <div className="glass-panel skeleton-booking" key={index}>
        <div>
          <SkeletonLine width="24%" height={20} />
          <SkeletonLine width="58%" height={24} style={{ marginTop: '1rem' }} />
          <SkeletonLine width="82%" />
          <SkeletonLine width="46%" />
        </div>
        <div className="skeleton-booking-side">
          <SkeletonLine width="110px" height={16} />
          <SkeletonLine width="140px" height={30} />
          <SkeletonLine width="130px" height={36} style={{ borderRadius: 10 }} />
        </div>
      </div>
    ))}
  </div>
);

export const TransactionTableSkeleton = ({ count = 7 }) => (
  <div className="skeleton-table">
    {Array.from({ length: count }).map((_, index) => (
      <div className="skeleton-table-row" key={index}>
        <SkeletonLine width="18%" />
        <SkeletonLine width="16%" />
        <SkeletonLine width="15%" />
        <SkeletonLine width="13%" />
        <SkeletonLine width="16%" />
        <SkeletonLine width="12%" />
      </div>
    ))}
  </div>
);

export default SkeletonLine;
