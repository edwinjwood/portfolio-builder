import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import templates from '../templates';
import LandingCard from './LandingCard';
import Resume from './Resume';
import ProjectsSimple from './ProjectsSimple';

export default function TemplatePreview() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const view = (search.get('view') || 'landing').toLowerCase();

  const tpl = templates.find(t => t.id === id);
  if (!tpl) {
    return (
      <div className="w-full h-screen grid place-items-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Template not found</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">No template with id "{id}"</p>
        </div>
      </div>
    );
  }

  const { defaults } = tpl;

  let content = null;
  switch (view) {
    case 'landing':
      content = <LandingCard data={defaults.landing} variant="classic" />;
      break;
    case 'resume':
      content = <Resume data={defaults.resume} />;
      break;
    case 'projects':
      content = <ProjectsSimple data={defaults.projects} />;
      break;
    default:
      content = <LandingCard data={defaults.landing} variant="classic" />;
  }

  return (
    <div className="min-h-screen w-full h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-stretch justify-stretch">
      {content}
    </div>
  );
}
