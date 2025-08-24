import React from 'react';
import { Link } from 'react-router-dom';
const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=cccccc&color=222222&size=128';
import virtualBCData from '../data/virtualBC.json';

function LandingCard({ data, preview, scale = 1 }) {
  const d = data || virtualBCData;
  // Use HomeCard layout for both preview and main card
  return (
    <main id="content" className={`w-full h-full grid place-items-center font-sans text-gray-900 dark:text-gray-100 ${preview ? 'pointer-events-none select-none' : ''}`}>
      <div className="w-full px-4 flex justify-center">
        <div
          className="relative w-full max-w-[640px] aspect-[16/7] rounded-[18px] border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/75 backdrop-blur shadow-xl overflow-hidden paper-texture paper-card flex"
          style={{ minHeight: '320px', transform: preview ? `scale(${scale})` : 'none', transformOrigin: 'top left' }}
        >
          {/* Overlay only for main card */}
          {!preview && <Link to="/resume" aria-label="Open resume" className="absolute inset-0 z-0" />}
          {/* Top-right actions */}
          <div className="flex absolute top-4 right-4 gap-3 z-20">
            <span className="text-sm px-4 py-2 rounded-md bg-brand-600 text-white">Resume</span>
            <span className="text-sm px-4 py-2 rounded-md border border-brand-600 text-brand-700 dark:text-brand-300">Projects</span>
          </div>
          {/* Mobile layout: avatar top-left, text centered */}
          <div className="absolute top-4 left-4 z-20 sm:hidden">
            <div className="shrink-0 rounded-full p-[2px] ring-2 ring-brand-500/60 bg-gray-50 dark:bg-gray-900">
              <img src={defaultAvatar} alt="Avatar" className="block h-20 w-20 rounded-full object-cover" />
            </div>
          </div>
          <div className="absolute inset-0 px-8 grid place-items-center text-center z-10 sm:hidden">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight mb-2">{d.title}</h1>
              <p className="mt-1 text-base text-gray-600 dark:text-gray-300">{d.subtitle}</p>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">{d.description}</div>
            </div>
          </div>
          {/* Desktop/tablet layout: side-by-side, left-aligned */}
          <div className="hidden sm:flex sm:items-center sm:justify-start w-full h-full px-10">
            <div className="flex items-center gap-8 w-full">
              <div className="shrink-0 rounded-full p-[2px] ring-2 ring-brand-500/60 bg-gray-50 dark:bg-gray-900">
                <img src={defaultAvatar} alt="Avatar" className="block h-32 w-32 rounded-full object-cover" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">{d.title}</h1>
                <p className="mt-1 text-lg text-gray-600 dark:text-gray-300">{d.subtitle}</p>
                <div className="mt-2 text-base text-gray-500 dark:text-gray-400">{d.description}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LandingCard;
