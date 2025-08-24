import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import { useTheme } from '../features/auth/context/ThemeContext';
import { useTenant } from '../contexts/TenantContext';

// Minimal nav: Home on the left, Login and theme icon on the right
const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const { tenant, user } = useTenant();
  const navigate = typeof window !== 'undefined' && window.location ? (window.__REACT_ROUTER_NAVIGATE__ || null) : null;
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  function getContrastText(bgColor) {
    // Simple luminance check for hex color
    if (!bgColor || !/^#([A-Fa-f0-9]{6})$/.test(bgColor)) return '#222';
    const r = parseInt(bgColor.substr(1,2),16);
    const g = parseInt(bgColor.substr(3,2),16);
    const b = parseInt(bgColor.substr(5,2),16);
    // Perceptual luminance formula
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    return luminance < 0.5 ? '#fff' : '#222';
  }
  // Calculate nav bar background and contrast color once
  const navBgColor = currentUser && tenant?.theme?.primaryColor ? tenant.theme.primaryColor : (dark ? '#1a202c' : '#fff');
  const contrastColor = getContrastText(navBgColor);
  return (
    <nav
      className="backdrop-blur border-b shadow-sm py-4 mb-2 sm:mb-8 transition-colors"
      style={{
        background: currentUser && tenant?.theme?.primaryColor ? tenant.theme.primaryColor : (dark ? '#1a202c' : '#fff'),
        borderColor: currentUser && tenant?.theme?.secondaryColor ? tenant.theme.secondaryColor : (dark ? '#2d3748' : '#e2e8f0'),
      }}
    >
      <div className="max-w-7xl mx-auto flex px-6 items-center justify-between">
        {/* Logo on the left, show tenant logo if available */}
  <NavLink to={currentUser ? "/dashboard" : "/"} end className="flex items-center gap-2 select-none" aria-label="Faset Home">
          {tenant && tenant.theme && tenant.theme.logoUrl && currentUser ? (
            <img src={tenant.theme.logoUrl.startsWith('/') ? tenant.theme.logoUrl : `/${tenant.theme.logoUrl}`} alt={tenant.name} className="h-8 w-8 mr-2" />
          ) : null}
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{
              color: currentUser && tenant?.theme?.primaryColor
                ? getContrastText(tenant.theme.primaryColor)
                : (currentUser && tenant?.theme?.secondaryColor ? tenant.theme.secondaryColor : undefined)
            }}
          >
            {currentUser && tenant ? tenant.name : 'Faset'}
          </span>
        </NavLink>
        {/* Desktop menu right aligned */}
        <div className="hidden md:flex items-center gap-8 ml-auto">
          {['/dashboard','/admin'].map((route, idx) => (
            currentUser && (
              <NavLink
                key={route}
                to={route}
                className={({isActive}) => `font-semibold transition ${isActive ? 'underline' : ''}`}
                style={{ color: currentUser && tenant?.theme?.primaryColor ? getContrastText(tenant.theme.primaryColor) : (dark ? '#fff' : '#222') }}
              >
                {route === '/dashboard' ? 'Dashboard' : 'Admin'}
              </NavLink>
            )
          ))}
          {!currentUser && (
            <NavLink to="/portfolio-preview" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500 underline' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`}>Portfolio Templates</NavLink>
          )}
          {!currentUser && (
            <NavLink to="/pricing" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500 underline' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`}>Pricing & Plans</NavLink>
          )}
          {!currentUser && (
            <NavLink to="/login" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Login</NavLink>
          )}
          {!currentUser && (
            <NavLink to="/signup" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Sign up</NavLink>
          )}
          {currentUser && (
            <span style={{ color: currentUser && tenant?.theme?.primaryColor ? getContrastText(tenant.theme.primaryColor) : (dark ? '#fff' : '#222') }} className="text-sm">Hi, {currentUser.name || currentUser.email}</span>
          )}
          {currentUser && (
            <button
              onClick={async () => {
                await logout();
                window.location.hash = '#/';
              }}
              style={{ color: contrastColor, borderColor: contrastColor }}
              className="text-xs px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          )}
          <button
            onClick={toggle}
            className="ml-4 p-2 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-pressed={dark}
            aria-label="Toggle dark mode"
            style={{ background: navBgColor, borderColor: contrastColor }}
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24"
                style={{ stroke: contrastColor, fill: contrastColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24"
                style={{ stroke: contrastColor }}>
                <circle cx="12" cy="12" r="5" stroke={contrastColor} strokeWidth="2" fill={contrastColor} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={contrastColor} />
              </svg>
            )}
          </button>
        </div>
        {/* Hamburger for mobile: only show for non-tenant users */}
        {!currentUser && (
          <div className="flex md:hidden items-center ml-auto">
            <button
              className="p-2 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {/* Mobile menu dropdown: only show for non-tenant users */}
      {!currentUser && menuOpen && (
        <div className="md:hidden w-full bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800 z-40">
          <div className="flex flex-col gap-2 px-6 py-4">
            <NavLink to="/portfolio-preview" className={({isActive}) => `font-semibold transition block py-2 px-4 rounded ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`} onClick={() => setMenuOpen(false)}>Portfolio Templates</NavLink>
            <NavLink to="/pricing" className={({isActive}) => `font-semibold transition block py-2 px-4 rounded ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`} onClick={() => setMenuOpen(false)}>Pricing & Plans</NavLink>
            <NavLink to="/login" className={({isActive}) => `font-semibold transition block py-2 px-4 rounded ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`} onClick={() => setMenuOpen(false)}>Login</NavLink>
            <NavLink to="/signup" className={({isActive}) => `font-semibold transition block py-2 px-4 rounded ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`} onClick={() => setMenuOpen(false)}>Sign up</NavLink>
            <button
              onClick={toggle}
              className="mt-2 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-pressed={dark}
              aria-label="Toggle dark mode"
            >
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
