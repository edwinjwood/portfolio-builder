import React from 'react';
import Resume from './Resume';
import defaultResume from './resume.json';

export default function ResumePreview({ data }) {
  // Use defaultResume if no real data is provided
  const resumeData = data && data.header ? data : defaultResume;

  return (
    <div className="preview-container">
      <Resume data={resumeData} isPreview={true} />
    </div>
  );
}
