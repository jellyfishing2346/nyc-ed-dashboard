import React from 'react';

export default function MetricCard({ label, value, explanation, size = 'default' }) {
  const sizeClasses = {
    default: '38px',
    small: '32px',
    large: '48px'
  };

  return (
    <div className="metric">
      <span>{label}</span>
      <strong style={{ fontSize: sizeClasses[size] }}>{value}</strong>
      <p>{explanation}</p>
    </div>
  );
}