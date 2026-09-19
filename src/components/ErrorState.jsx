import React from 'react';

export default function ErrorState({ message, onRetry, retryLabel = "Try again" }) {
  return (
    <div className="state error">
      <div className="error-content">
        <strong>Unable to load NYC Open Data.</strong>
        <p>{message}</p>
        <button type="button" onClick={onRetry}>{retryLabel}</button>
      </div>
    </div>
  );
}