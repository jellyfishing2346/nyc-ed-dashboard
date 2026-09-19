import React from 'react';

export default function LoadingState({ message = "Loading NYC Open Data…" }) {
  return (
    <div className="state">
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>{message}</p>
      </div>
    </div>
  );
}