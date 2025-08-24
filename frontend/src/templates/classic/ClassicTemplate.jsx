import React from 'react';
import styles from './classic.module.css';

export default function ClassicTemplate({ data }) {
  // Render the full classic resume/portfolio
  return (
    <div className={styles.classicTemplate}>
      <h1>{data.name || 'Your Name'}</h1>
      {/* Render more sections here using data */}
      <p>{data.summary || 'Professional summary goes here.'}</p>
      {/* ... */}
    </div>
  );
}
