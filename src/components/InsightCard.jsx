import React from 'react';

export default function InsightCard({ label, value, description }) {
  return (
    <article className="storyItem">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}