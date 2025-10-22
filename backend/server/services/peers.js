const path = require('path');
const fs = require('fs');

// Base directory for peer data CSVs
const PEERS_BASE = process.env.PEERS_BASE || path.join(__dirname, '../../data/peers');

/**
 * Find the appropriate peer CSV file based on job title/text
 * @param {string} text - Text to analyze for finding relevant peer data
 * @returns {string|null} Path to CSV file or null if not found
 */
function findPeerCsvForTitle(text) {
  if (!fs.existsSync(PEERS_BASE)) {
    return null;
  }
  
  const textLower = (text || '').toLowerCase();
  
  // Map common keywords to CSV files
  const mappings = [
    { keywords: ['nurse', 'nursing', 'clinical', 'patient care'], file: 'nursing.csv' },
    { keywords: ['software', 'developer', 'engineer', 'programming'], file: 'software.csv' },
    { keywords: ['data', 'analyst', 'scientist', 'ml', 'machine learning'], file: 'data.csv' },
    { keywords: ['embedded', 'firmware', 'hardware'], file: 'embedded.csv' },
    { keywords: ['robot', 'robotics', 'ros'], file: 'robotics.csv' }
  ];
  
  for (const mapping of mappings) {
    if (mapping.keywords.some(kw => textLower.includes(kw))) {
      const csvPath = path.join(PEERS_BASE, mapping.file);
      if (fs.existsSync(csvPath)) {
        return csvPath;
      }
    }
  }
  
  return null;
}

/**
 * Pick domain classification based on text analysis
 * @param {string} text - Text to analyze
 * @returns {string} Domain classification (e.g., 'nursing', 'software', 'generic')
 */
function pickDomain(text) {
  const textLower = (text || '').toLowerCase();
  
  if (/nurs|clinic|patient|care|emr|ehr|epic|hipaa/.test(textLower)) {
    return 'nursing';
  }
  if (/embedded|firmware|stm32|esp32|rtos|micro/.test(textLower)) {
    return 'embedded';
  }
  if (/robot|ros|slam|perception/.test(textLower)) {
    return 'robotics';
  }
  if (/data|ml|machine|ai|analytics|scientist/.test(textLower)) {
    return 'data';
  }
  if (/software|developer|engineer|programming|javascript|python/.test(textLower)) {
    return 'software';
  }
  
  return 'generic';
}

module.exports = {
  findPeerCsvForTitle,
  pickDomain,
  PEERS_BASE
};
