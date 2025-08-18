import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NavBar = ({ dark, setDark }) => {
  const location = useLocation();
  const showExport = location.pathname === '/resume';

  return (
    <nav className="bg-white/90 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm py-4 mb-2 sm:mb-8 transition-colors">
      <div className="max-w-3xl mx-auto flex gap-6 px-4 items-center">
        <div className="flex gap-4">
          <NavLink to="/" end className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Home</NavLink>
          <NavLink to="/resume" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Resume</NavLink>
          <NavLink to="/projects" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Projects</NavLink>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <button onClick={() => setDark(d => { const nv = !d; try { localStorage.setItem('dark', nv.toString()); } catch(e){} return nv; })} className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" aria-pressed={dark} aria-label="Toggle dark mode">{dark ? 'Light' : 'Dark'}</button>
          {showExport && (
            <button
              onClick={() => window.print()}
              className="text-xs px-3 py-1 rounded font-medium border border-brand-600 text-brand-600 bg-white/60 backdrop-blur hover:bg-brand-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-brand-400 dark:text-brand-300 dark:bg-gray-800/70 dark:hover:bg-brand-500 dark:hover:text-gray-900 dark:focus-visible:ring-offset-gray-900 transition"
              aria-label="Export PDF (Print)"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
