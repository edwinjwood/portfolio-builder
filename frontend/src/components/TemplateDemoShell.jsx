import React from 'react';
import { Link, NavLink as RouterNavLink, useNavigate, useParams } from 'react-router-dom';
import templates from '../templates';
import LandingCard from './LandingCard';
import Resume from './Resume';
import ProjectsSimple from './ProjectsSimple';
import Projects from './Projects';
import { useTheme } from '../features/auth/context/ThemeContext';

export default function TemplateDemoShell({ view = 'landing' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const tpl = templates.find(t => t.id === id);

  if (!tpl) {
    return (
      <div className="w-full h-screen grid place-items-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Template not found</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">No template with id "{id}"</p>
          <Link to="/portfolio-preview" className="inline-block mt-4 text-brand-600 hover:underline">Back to templates</Link>
        </div>
      </div>
    );
  }

  const { defaults } = tpl;

  const NavLink = ({ to, label, end=false }) => (
    <RouterNavLink
      to={to}
      end={end}
      className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`}
      aria-current={({isActive}) => isActive ? 'page' : undefined}
    >
      {label}
    </RouterNavLink>
  );

  let content = null;
  switch (view) {
    case 'landing':
      content = <LandingCard data={defaults.landing} variant="classic" linksTo={{ resume: `/demo/${tpl.id}/resume`, projects: `/demo/${tpl.id}/projects` }} />;
      break;
    case 'resume':
      content = <Resume data={defaults.resume} />;
      break;
    case 'projects':
      // Use the richer Projects for demo to match old portfolio feel
      content = <Projects />;
      break;
    default:
      content = <LandingCard data={defaults.landing} variant="classic" />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sticky container holding both the demo bar and the portfolio nav */}
      <div className="sticky top-0 z-40">
        {/* Top demo info bar */}
        <div className="w-full bg-brand-50 dark:bg-gray-900/80 border-b border-brand-200/70 dark:border-gray-800 text-brand-800 dark:text-brand-300">
          <div className="w-full flex items-center px-4 py-2">
            <span className="text-sm font-semibold">Classic portfolio demo</span>
            <button
              type="button"
              className="ml-auto text-xs px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700"
              onClick={() => {
                const { currentUser } = require('../context/AuthContext').useAuth();
                if (!currentUser) navigate('/login');
              }}
            >
              Start Building
            </button>
          </div>
        </div>
        {/* Portfolio-style nav (demo site’s own nav) */}
        <nav className="bg-white/90 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm py-4 transition-colors">
          <div className="max-w-3xl mx-auto flex px-4 items-center">
            {/* Left: site navigation */}
            <div className="flex items-center gap-3">
              <NavLink to={`/demo/${tpl.id}`} label="Home" end />
              <NavLink to={`/demo/${tpl.id}/resume`} label="Resume" />
              <NavLink to={`/demo/${tpl.id}/projects`} label="Projects" />
            </div>
            {/* Right: actions */}
            <div className="ml-auto flex items-center gap-3">
              {view === 'resume' && (
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Export PDF
                </button>
              )}
              <button onClick={toggle} className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" aria-pressed={dark} aria-label="Toggle dark mode">{dark ? 'Light' : 'Dark'}</button>
            </div>
          </div>
        </nav>
      </div>
      <main className={view === 'landing' ? "flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4" : "mx-auto max-w-6xl px-4 py-6"}>
        {content}
      </main>
    </div>
  );
}
