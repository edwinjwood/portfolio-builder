import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveDraft } from '../utils/draft';
import { useAuth } from '../features/user/context/AuthContext';
import LandingCard from './LandingCard';
import Resume from './Resume';
import ProjectsSimple from './ProjectsSimple';
import classic from '../templates/classic';
import minimal from '../templates/minimal';

const templates = [
  {
    id: classic.id,
    title: classic.name,
    tagline: 'Business Card landing + Resume + Projects',
    description:
      'A clean, modern portfolio that opens with a virtual business card landing page and links to a focused resume and projects view.',
    previewPath: classic.previewPath,
    includes: ['Virtual Business Card', 'Resume', 'Projects'],
    defaults: classic.defaults
  },
  {
    id: minimal.id,
    title: minimal.name,
    tagline: minimal.tagline,
    description: minimal.description,
    previewPath: minimal.previewPath,
    includes: minimal.includes,
    defaults: minimal.defaults
  }
];

function PreviewFrame({ width = 640, height = 400, scale = 0.35, className = '', children }) {
  const outerStyle = { width: width * scale, height: height * scale };
  const innerStyle = { width, height, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' };
  return (
    <div className={`rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-900 ${className}`} style={outerStyle}>
      <div style={innerStyle}>{children}</div>
    </div>
  );
}

export default function TemplateGallery() {
  const views = ['landing', 'resume', 'projects'];

  function TemplateCard({ t }) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [idx, setIdx] = useState(0);
    const view = views[idx];
    const next = () => setIdx((idx + 1) % views.length);
    const prev = () => setIdx((idx - 1 + views.length) % views.length);

    const renderView = () => {
      switch (view) {
        case 'landing':
          return (
            <PreviewFrame width={560} height={320} scale={0.36}>
              <LandingCard data={t.defaults.landing} variant="classic" />
            </PreviewFrame>
          );
        case 'resume':
          return (
            <PreviewFrame width={720} height={460} scale={0.32}>
              <Resume data={t.defaults.resume} />
            </PreviewFrame>
          );
        case 'projects':
          return (
            <PreviewFrame width={720} height={420} scale={0.32}>
              <ProjectsSimple data={t.defaults.projects} />
            </PreviewFrame>
          );
        default:
          return null;
      }
    };

    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {/* Textual details */}
          <div className="md:col-span-3">
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300">{t.tagline}</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{t.description}</p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
              {t.includes.map((i, idx) => (
                <li key={idx} className="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700">{i}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!currentUser) {
                    navigate('/login');
                  }
                  // else: could show a toast or do nothing for now
                }}
                className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
              >
                Start Building
              </button>
              <a
                href={`#/demo/${t.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Open full demo ↗
              </a>
            </div>
          </div>
          {/* Inline carousel preview */}
          <div className="md:col-span-2">
            <div className="relative h-[340px] grid place-items-center overflow-hidden rounded-md bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
              <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-white/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 backdrop-blur">
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </div>
              {renderView()}
              {/* Arrows */}
              <button
                aria-label="Previous"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-white/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900"
              >
                ‹
              </button>
              <button
                aria-label="Next"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-white/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900"
              >
                ›
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 flex gap-1">
                {views.map((v, i) => (
                  <button
                    key={v}
                    aria-label={`Show ${v}`}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 w-6 rounded-full ${i===idx ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main id="content" className="w-full min-h-[70vh] grid place-items-center font-sans text-gray-900 dark:text-gray-100">
        <div className="w-full max-w-5xl px-4">
          <h1 className="text-3xl font-bold mb-2">Portfolio Templates</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Pick a starting point. You can customize everything later.</p>
          <div className="grid gap-6">
            {templates.map(t => (
              <TemplateCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      </main>
  );
}
