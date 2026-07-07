import React from 'react';

const ActionLoader = ({ label = 'Processing...', block = false }) => (
  <span className={block ? 'action-loader action-loader-block' : 'action-loader'}>
    <span className="action-loader-spinner" aria-hidden="true" />
    <span>{label}</span>
  </span>
);

export default ActionLoader;
