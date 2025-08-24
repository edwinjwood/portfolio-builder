import React from 'react';
import styles from './classic.module.css';

export default function ClassicPreview({ template }) {
  // Render a compact preview for the modal
  return (
    <div className={styles.classicPreview}>
      <h2>{template.name}</h2>
      <img src={template.preview_url} alt={template.name + ' preview'} style={{ width: '100%', borderRadius: 8 }} />
      <p>{template.description}</p>
    </div>
  );
}
