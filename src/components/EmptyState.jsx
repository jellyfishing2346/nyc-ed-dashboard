import React from 'react';

export default function EmptyState({ message = "No data is available for this selection." }) {
  return (
    <div className="state empty">
      <div className="empty-content">
        <p>{message}</p>
      </div>
    </div>
  );
}