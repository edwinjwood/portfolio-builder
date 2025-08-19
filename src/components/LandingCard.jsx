import React from 'react';
import { Link } from 'react-router-dom';
import defaultData from '../data/virtualBC.json';

// Simple variant style map (can expand per template)
const styles = {
  classic: {
    container: 'relative w-full max-w-[560px] aspect-[7/4] rounded-[14px] border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/75 backdrop-blur shadow-xl overflow-hidden paper-texture paper-card',
    title: 'text-2xl font-extrabold tracking-tight',
    subtitle: 'mt-1 text-sm text-gray-600 dark:text-gray-300',
    desc: 'mt-2 text-xs text-gray-500 dark:text-gray-400'
  },
  minimal: {
    container: 'relative w-full max-w-[560px] aspect-[7/4] rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm shadow overflow-hidden',
    title: 'text-xl font-bold tracking-tight',
    subtitle: 'mt-1 text-xs text-gray-600 dark:text-gray-300',
    desc: 'mt-2 text-[11px] text-gray-500 dark:text-gray-400'
  }
};

export default function LandingCard({ data, variant = 'classic', linksTo }) {
  const d = data || defaultData;
  const s = styles[variant] || styles.classic;
  const resumeHref = linksTo?.resume || '/resume';
  const projectsHref = linksTo?.projects || '/projects';
  const initials = (d.title || 'User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
  return (
    <main id="content" className="w-full h-full grid place-items-center font-sans text-gray-900 dark:text-gray-100">
      <div className="w-full px-4 flex justify-center">
        <div className={s.container}>
          {/* Click-through overlay to open resume */}
          <Link to={resumeHref} aria-label="Open resume" className="absolute inset-0 z-0" />
          {/* Top-right actions */}
          <div className="flex absolute top-3 right-3 gap-2 z-20">
            <Link to={resumeHref} className="text-xs px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Resume</Link>
            <Link to={projectsHref} className="text-xs px-3 py-1.5 rounded-md border border-brand-600 text-brand-700 dark:text-brand-300 hover:bg-brand-50/60 dark:hover:bg-gray-800">Projects</Link>
          </div>
          {/* Mobile layout */}
          <div className="absolute top-3 left-3 z-20 sm:hidden">
            <div className="shrink-0 rounded-full ring-2 ring-brand-500/60 bg-gradient-to-br from-brand-600 to-brand-400 text-white grid place-items-center h-16 w-16">
              <span className="font-bold text-lg select-none" aria-hidden="true">{initials}</span>
              <span className="sr-only">Avatar</span>
            </div>
          </div>
          <div className="absolute inset-0 px-6 grid place-items-center text-center z-10 sm:hidden">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight">{d.title}</h1>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{d.subtitle}</p>
              <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{d.description}</div>
            </div>
          </div>
          {/* Desktop/tablet layout */}
          <div className="hidden sm:absolute sm:inset-0 sm:px-6 sm:flex sm:items-center sm:justify-start">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="shrink-0 rounded-full ring-2 ring-brand-500/60 bg-gradient-to-br from-brand-600 to-brand-400 text-white grid place-items-center h-24 w-24">
                <span className="font-bold text-2xl select-none" aria-hidden="true">{initials}</span>
                <span className="sr-only">Avatar</span>
              </div>
              <div className="min-w-0">
                <h1 className={s.title}>{d.title}</h1>
                <p className={s.subtitle}>{d.subtitle}</p>
                <div className={s.desc}>{d.description}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
