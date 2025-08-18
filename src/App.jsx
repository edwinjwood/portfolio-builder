
import './App.css';
import { HashRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import headshotUrl from '../assets/Headshot.png';
import viteLogo from '/vite.svg';
import Projects from './Projects';
import Resume from './Resume';

function HomeCard() {
  return (
    <main id="content" className="w-full h-full grid place-items-center font-sans text-gray-900 dark:text-gray-100">
      <div className="w-full px-4 flex justify-center">
  <div className="relative w-full max-w-[560px] aspect-[7/4] rounded-[14px] border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/75 backdrop-blur shadow-xl overflow-hidden paper-texture paper-card">
          {/* Click-through overlay to open resume */}
          <Link to="/resume" aria-label="Open resume" className="absolute inset-0 z-0" />
          {/* Top-right actions */}
          <div className="flex absolute top-3 right-3 gap-2 z-20">
            <Link to="/resume" className="text-xs px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Resume</Link>
            <Link to="/projects" className="text-xs px-3 py-1.5 rounded-md border border-brand-600 text-brand-700 dark:text-brand-300 hover:bg-brand-50/60 dark:hover:bg-gray-800">Projects</Link>
          </div>

          {/* Mobile layout: avatar top-left, text centered */}
          <div className="absolute top-3 left-3 z-20 sm:hidden">
            <div className="shrink-0 rounded-full p-[2px] ring-2 ring-brand-500/60 bg-gray-50 dark:bg-gray-900">
              <img src={headshotUrl} alt="Edwin J. Wood headshot" className="block h-16 w-16 rounded-full object-cover" />
            </div>
          </div>
          <div className="absolute inset-0 px-6 grid place-items-center text-center z-10 sm:hidden">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight">Edwin J. Wood</h1>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Technology & Platform Transformation Leader</p>
              <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">Columbia, SC · <a href="mailto:edwinjwood@gmail.com" className="hover:underline">edwinjwood@gmail.com</a></div>
            </div>
          </div>

          {/* Desktop/tablet layout: side-by-side, left-aligned */}
          <div className="hidden sm:absolute sm:inset-0 sm:px-6 sm:flex sm:items-center sm:justify-start">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="shrink-0 rounded-full p-[2px] ring-2 ring-brand-500/60 bg-gray-50 dark:bg-gray-900">
                <img src={headshotUrl} alt="Edwin J. Wood headshot" className="block h-24 w-24 rounded-full object-cover" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight">Edwin J. Wood</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Technology & Platform Transformation Leader</p>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Columbia, SC · <a href="mailto:edwinjwood@gmail.com" className="hover:underline">edwinjwood@gmail.com</a></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Shell() {
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const firstRenderRef = useRef(true);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('dark') === 'true'; } catch(e) { return false; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [dark]);
  useEffect(() => { firstRenderRef.current = false; }, []);

  const showExport = location.pathname === '/resume';

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-600 text-white px-3 py-2 rounded">Skip to content</a>
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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={firstRenderRef.current ? false : { opacity: 0, y: prefersReduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReduced ? 0 : -6 }}
          transition={{ duration: prefersReduced ? 0 : 0.25, ease: 'easeOut' }}
          className="flex-1 grid place-items-center"
        >
          <Routes location={location}>
            <Route path="/" element={<HomeCard />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 pb-6 mt-4 sm:mt-8 opacity-90">
        <div>© {new Date().getFullYear()} Edwin J. Wood</div>
        <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="opacity-90">Built With:</span>
          <span className="inline-flex items-center" aria-label="React" title="React">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="2.2" />
              <ellipse cx="12" cy="12" rx="10" ry="4.5" />
              <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
              <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
            </svg>
          </span>
          <span className="opacity-60">+</span>
          <img src={viteLogo} alt="Vite" className="h-4 w-4" title="Vite" />
          <span className="opacity-60">+</span>
          <span className="inline-flex items-center" aria-label="Tailwind CSS" title="Tailwind CSS">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.5 6.5c-2.3 0-3.8 1.2-4.5 3.6C6.5 12 5.4 13 3.5 13c-1 0-1.8-.3-2.3-.9.7 2.2 2.1 3.4 4.1 3.4 2.3 0 3.8-1.2 4.5-3.6.5-1.6 1.5-2.4 3-2.4 1.1 0 1.9.3 2.4.9.1-2.2-1.2-3.9-3.7-3.9zM20.5 8.5c-2.3 0-3.8 1.2-4.5 3.6-.5 1.6-1.5 2.4-3 2.4-1.1 0-1.9-.3-2.4-.9-.1 2.2 1.2 3.9 3.7 3.9 2.3 0 3.8-1.2 4.5-3.6.5-1.6 1.5-2.4 3-2.4 1.1 0 1.9.3 2.4.9.1-2.2-1.2-3.9-3.7-3.9z" />
            </svg>
          </span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}

export default App;
