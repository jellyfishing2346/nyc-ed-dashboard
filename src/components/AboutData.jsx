import React, { useState } from 'react';

export default function AboutData() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="aboutSection" aria-labelledby="about-heading">
      <button 
        className="about-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="about-content"
      >
        <span>About this data</span>
        <span className="toggle-icon" aria-hidden="true">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      
      {isExpanded && (
        <div id="about-content" className="about-content">
          <div className="about-grid">
            <div className="about-item">
              <h4>Data source</h4>
              <p>NYC Open Data / NYC Department of Health and Mental Hygiene</p>
            </div>
            <div className="about-item">
              <h4>Data period</h4>
              <p>March 2020–December 2022</p>
            </div>
            <div className="about-item">
              <h4>Geography</h4>
              <p>Modified ZIP Code Tabulation Area (MODZCTA)</p>
            </div>
            <div className="about-item">
              <h4>Latest extraction</h4>
              <p>Dashboard uses the latest dataset extraction to avoid counting repeated historical snapshots</p>
            </div>
            <div className="about-item">
              <h4>Rate calculations</h4>
              <p>All rates use the same selected geography (All NYC or specific MODZCTA)</p>
            </div>
            <div className="about-item">
              <h4>7-day averages</h4>
              <p>Rolling 7-day rates reduce day-to-day volatility, especially in smaller MODZCTAs</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}