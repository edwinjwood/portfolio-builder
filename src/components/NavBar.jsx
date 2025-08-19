import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import { useTheme } from '../features/auth/context/ThemeContext';

// Minimal nav: Home on the left, Login and theme icon on the right
const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const { dark, toggle } = useTheme();
  return (
    <nav className="bg-white/90 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm py-4 mb-2 sm:mb-8 transition-colors">
      <div className="max-w-3xl mx-auto flex px-4 items-center">
        <div className="flex gap-6 items-center">
          <NavLink to="/" end className="flex items-center gap-2 select-none" aria-label="Facet Home">
            <span className="text-2xl font-extrabold tracking-tight text-brand-700 dark:text-brand-400">Facet</span>
          </NavLink>
          <NavLink to="/portfolio-preview" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500 underline' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`}>Portfolio Templates</NavLink>
          <NavLink to="/pricing" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500 underline' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`}>Pricing & Plans</NavLink>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {!currentUser ? (
            <>
              <NavLink to="/login" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Login</NavLink>
              <NavLink to="/signup" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Sign up</NavLink>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-300">Hi, {currentUser.name || currentUser.email}</span>
              <button onClick={logout} className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button>
            </>
          )}
          {/* Theme toggle icon button, always at far right */}
          <button
            onClick={toggle}
            className="ml-4 p-2 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-pressed={dark}
            aria-label="Toggle dark mode"
          >
            {dark ? (
              // Moon icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
            ) : (
              // Sun icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
