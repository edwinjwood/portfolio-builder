import React from 'react';
import LandingCard from './LandingCard';
import Resume from './Resume';
import ProjectsSimple from './ProjectsSimple';
import defaultLanding from './landing.json';
import defaultResume from './resume.json';
import defaultProjects from './projects.json';

export default function ClassicPreview() {
  return (
    <div className="template-preview-container">
      <LandingCard data={defaultLanding} preview scale={0.5} />
      <Resume data={defaultResume} preview scale={0.5} />
      <ProjectsSimple data={defaultProjects} preview scale={0.5} />
    </div>
  );
}
