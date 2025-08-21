import landing from './landing.json';
import resume from './resume.json';
import projects from './projects.json';

export const classicTemplate = {
  id: 'classic',
  name: 'Classic Portfolio',
  description: 'Business Card landing + Resume + Projects',
  previewPath: '/virtual-bc',
  defaults: { landing, resume, projects }
};

export default classicTemplate;
