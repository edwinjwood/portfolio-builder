import React from 'react';
import viteLogo from '/vite.svg';

const Footer = () => (
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
);

export default Footer;
