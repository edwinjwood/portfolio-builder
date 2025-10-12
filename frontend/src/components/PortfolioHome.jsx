import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import VirtualBC from './VirtualBC';
import Resume from './Resume';

export default function PortfolioHome() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  // If running in dev, allow reading on-disk generated component JSON for quick visual feedback
  const [generatedVirtualBC, setGeneratedVirtualBC] = useState(null);
  const [lastOptimistic, setLastOptimistic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // selectedComponent controls the left menu selection. default to virtualbc
  const [selectedComponent, setSelectedComponent] = useState('virtualbc');

  async function fetchPortfolio() {
    setLoading(true);
    setError('');
    try {
      // If user is signed in, use the protected endpoint; otherwise use public endpoint
      const apiBase = import.meta.env.VITE_API_URL;
      const url = currentUser && currentUser.token
        ? `${apiBase}/api/portfolios/${id}`
        : `${apiBase}/api/portfolios/public/${id}`;
      const headers = currentUser && currentUser.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error loading portfolio');
      } else {
        const serverData = await res.json();
        // If we recently applied optimistic edits, preserve those fields so the UI doesn't flash
          if (lastOptimistic && Date.now() - lastOptimistic.ts < 10000) { 
          try {
                  const preserved = { ...serverData };
                  const optimisticFields = lastOptimistic.fields || [];
                  const optimisticValues = lastOptimistic.values || {};
                  preserved.components = preserved.components || {};
                  preserved.components.virtualbc = preserved.components.virtualbc || {};
                  for (const f of optimisticFields) {
                    if (typeof optimisticValues[f] !== 'undefined') {
                      preserved.components.virtualbc[f] = optimisticValues[f];
                    }
                  }
                  // Only update state if the merged server data actually differs from current state
                  try {
                    if (portfolio && JSON.stringify(preserved) === JSON.stringify(portfolio)) {
                      // no-op - avoid re-render
                    } else {
                      setPortfolio(preserved);
                    }
                  } catch (e) {
                    setPortfolio(preserved);
                  }
                  // Clear the optimistic marker now that we've reconciled
                  setLastOptimistic(null);
          } catch (e) {
            setPortfolio(serverData);
          }
        } else {
          try {
            if (portfolio && JSON.stringify(serverData) === JSON.stringify(portfolio)) {
              // no-op
            } else {
              setPortfolio(serverData);
            }
          } catch (e) {
            setPortfolio(serverData);
          }
        }
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  }

  // Background reconcile that fetches latest server state without toggling loading/error UI
  async function reconcilePortfolio() {
    try {
      const apiBase = import.meta.env.VITE_API_URL;
      const url = currentUser && currentUser.token
        ? `${apiBase}/api/portfolios/${id}`
        : `${apiBase}/api/portfolios/public/${id}`;
      const headers = currentUser && currentUser.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) return; // ignore errors here
      const serverData = await res.json();
      if (lastOptimistic && Date.now() - lastOptimistic.ts < 10000) {
        // merge optimistic values
        const preserved = { ...serverData };
        const optimisticFields = lastOptimistic.fields || [];
        const optimisticValues = lastOptimistic.values || {};
        preserved.components = preserved.components || {};
        preserved.components.virtualbc = preserved.components.virtualbc || {};
        for (const f of optimisticFields) {
          if (typeof optimisticValues[f] !== 'undefined') {
            preserved.components.virtualbc[f] = optimisticValues[f];
          }
        }
        try {
          if (portfolio && JSON.stringify(preserved) === JSON.stringify(portfolio)) {
            // no-op
          } else {
            setPortfolio(preserved);
          }
        } catch (e) {
          setPortfolio(preserved);
        }
        setLastOptimistic(null);
      } else {
        try {
          if (portfolio && JSON.stringify(serverData) === JSON.stringify(portfolio)) {
            // no-op
          } else {
            setPortfolio(serverData);
          }
        } catch (e) {
          setPortfolio(serverData);
        }
      }
    } catch (e) {
      // ignore background errors
    }
  }

  useEffect(() => { fetchPortfolio(); }, [id, currentUser]);

  // In dev mode, try to load any on-disk generated virtualbc JSON so developers can
  // preview what the backend has written without needing DB reads or persistence.
  useEffect(() => {
    setGeneratedVirtualBC(null);
    if (!import.meta.env.DEV) return; // only in dev
    // Prefer explicit VITE_API_URL; if absent assume backend runs on localhost:5001
    const base = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== ''
      ? import.meta.env.VITE_API_URL
      : `${window.location.protocol}//${window.location.hostname}:5001`;
    // The server exposes generated_components at /generated_components
    const url = `${base.replace(/\/$/, '')}/generated_components/${id}/virtualbc.json`;
    // use cache: 'no-store' and a cache-busting param to ensure fresh reads while editing files
    fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' }).then(r => {
      if (!r.ok) return null;
      return r.json();
    }).then(j => {
      if (j) {
        // Trim common accidental whitespace in generated titles for display parity
        if (j.title && typeof j.title === 'string') j.title = j.title.trim();
        setGeneratedVirtualBC(j);
      }
    }).catch(() => { /* ignore */ });
  }, [id]);

  // (dev-only) manual refresh removed — on-disk generated JSON is loaded automatically on mount

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-4">
      {loading ? (
        <div className="mt-12 text-lg">Loading portfolio...</div>
      ) : error ? (
        <div className="mt-12 text-red-600">{error}</div>
      ) : (
        <>
          <div className="relative w-full">
            {/* Fixed left menu at the very left edge on larger screens */}
            <aside className="hidden sm:block fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] px-4">
              <div className="h-full">
                <h1 className="text-2xl font-bold mb-4 text-left">{portfolio.name}</h1>
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">Created: {portfolio.created_at}</div>
                <nav className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y">
                  <button
                    className={`w-full text-left px-4 py-3 ${selectedComponent === 'virtualbc' ? 'bg-gray-50 dark:bg-gray-900/40 text-brand-600 dark:text-brand-300 font-semibold border-l-4 border-brand-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => setSelectedComponent('virtualbc')}
                  >
                    Virtual Business Card
                  </button>
                  <button
                    className={`w-full text-left px-4 py-3 ${selectedComponent === 'resume' ? 'bg-gray-50 dark:bg-gray-900/40 text-brand-600 dark:text-brand-300 font-semibold border-l-4 border-brand-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => setSelectedComponent('resume')}
                  >
                    Resume
                  </button>
                  <button
                    className={`w-full text-left px-4 py-3 ${selectedComponent === 'projects' ? 'bg-gray-50 dark:bg-gray-900/40 text-brand-600 dark:text-brand-300 font-semibold border-l-4 border-brand-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                    onClick={() => setSelectedComponent('projects')}
                  >
                    Projects (coming soon)
                  </button>
                </nav>
              </div>
            </aside>

            {/* Centered work area with left margin equal to menu width on sm+ screens */}
            <div className="max-w-3xl mx-auto px-4 sm:ml-64 mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[320px]">
                {selectedComponent === 'virtualbc' && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Homecard</h2>
                    {/* Dev-only indicator showing whether we're using the on-disk generated JSON */}
                    <div className="flex items-center gap-3 mb-2">
                      {import.meta.env.DEV && generatedVirtualBC && (
                        <div className="text-sm text-green-700">Using generated_components/{id}/virtualbc.json</div>
                      )}
                    </div>
                    {/* Always render VirtualBC with merged data so it displays even if components.virtualbc is missing */}
                    <VirtualBC
                      preview={false}
                      editable={currentUser && currentUser.token}
                      componentId={portfolio && portfolio.component_refs && portfolio.component_refs.virtualbc}
                      data={
                        // Prefer on-disk generated JSON in dev for fast iteration, then DB components, then portfolio.name/currentUser
                        generatedVirtualBC || (
                          (portfolio.components && portfolio.components.virtualbc) ? {
                            title: (portfolio.components.virtualbc.title || portfolio.components.virtualbc.name) || portfolio.name || (currentUser && (currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim())) || 'Your Name',
                            subtitle: (portfolio.components.virtualbc.subtitle || portfolio.components.virtualbc.headline) || 'Professional • Portfolio',
                            description: (portfolio.components.virtualbc.description || portfolio.components.virtualbc.blurb) || (
                              (portfolio.components.virtualbc.contact && portfolio.components.virtualbc.contact.email) ? portfolio.components.virtualbc.contact.email : 'Contact info, links, and more.'
                            ),
                            avatar: portfolio.components.virtualbc.avatar || null,
                            contact: portfolio.components.virtualbc.contact || null,
                            socials: portfolio.components.virtualbc.socials || null,
                          } : {
                            title: portfolio.name || (currentUser && (currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim())) || 'Your Name',
                            subtitle: 'Professional • Portfolio',
                            description: 'Contact info, links, and more.',
                            avatar: null,
                            contact: null,
                            socials: null,
                          }
                        )
                      }
                      onSave={async (payload, componentId) => {
                        // payload: { type, data }
                        const newData = (payload && payload.data) ? payload.data : null;
                        try {
                          // apply optimistic saving flags and merge so UI updates immediately
                          if (newData) {
                            if (newData.title && typeof newData.title === 'string') newData.title = newData.title.trim();
                            const fields = Object.keys(newData || {});
                            // store optimistic values so background reconcile won't overwrite them
                            setLastOptimistic({ ts: Date.now(), fields, values: { ...(newData || {}) } });
                            // Optimistically update states immediately so there is no visible flash
                            setGeneratedVirtualBC(prev => ({ ...(prev || {}), ...(newData || {}) }));
                            setPortfolio(prev => {
                              if (!prev) return prev;
                              const existing = (prev.components && prev.components.virtualbc) ? { ...prev.components.virtualbc } : {};
                              const components = { ...(prev.components || {}), virtualbc: { ...existing, ...(newData || {}) } };
                              return { ...prev, components };
                            });
                          }

                          const apiBase = import.meta.env.VITE_API_URL;
                          const url = componentId
                            ? `${apiBase}/api/portfolios/${id}/components/${componentId}`
                            : `${apiBase}/api/portfolios/${id}/components`;
                          console.debug('Saving component', url, payload);
                          const res = await fetch(url, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser.token}` },
                            body: JSON.stringify(payload)
                          });

                          if (!res.ok) {
                            let errBody = null;
                            try { errBody = await res.json(); } catch (e) { /* ignore json parse */ }
                            const msg = (errBody && (errBody.error || errBody.message)) || `Save failed (${res.status})`;
                            console.error('Component save failed', res.status, errBody);
                            setError(msg);
                            // on failure, clear the optimistic marker so future reconciles don't keep the stale optimistic values
                            if (newData) setLastOptimistic(null);
                          } else {
                            // success: clear saving flags shortly after and reconcile in background
                            // success: nothing to do; optimistic state already applied
                            // Schedule a non-blocking background reconcile to reconcile any other server-side changes
                            setTimeout(() => { reconcilePortfolio().catch(() => {}); }, 1500);
                          }
                        } catch (e) {
                          console.error('Network error saving component', e);
                          setError(`Network error while saving: ${e.message}`);
                          if (newData) setLastOptimistic(null);
                        }
                      }}
                    />

                    {/* Inline editing is handled in the VirtualBC component — no buttons here */}
                  </div>
                )}

                {selectedComponent === 'resume' && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Resume</h2>
                    {portfolio.components && portfolio.components.resume ? (
                      <Resume data={{
                        header: {
                          name: portfolio.name || 'Your Name',
                          title: portfolio.components.resume.headline || 'Professional Summary',
                          email: (portfolio.components.virtualbc && portfolio.components.virtualbc.contact && portfolio.components.virtualbc.contact.email) || null,
                        },
                        summary: portfolio.components.resume.summary || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.',
                        competencies: portfolio.components.resume.competencies || [
                          { heading: 'Skills', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
                        ],
                        experience: (portfolio.components.resume.bullets || []).length > 0 ? [
                          {
                            company: 'Experience',
                            period: '',
                            roles: [],
                            bullets: portfolio.components.resume.bullets
                          }
                        ] : [],
                        education: portfolio.components.resume.education || [],
                      }} preview={false} />
                    ) : (
                      <div className="text-gray-500">No resume data available.</div>
                    )}
                  </div>
                )}

                {selectedComponent === 'projects' && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Projects</h2>
                    <div className="text-gray-500">Projects editing will be available soon.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* All component addition / editing is inline within the work area components. */}
        </>
      )}
    </main>
  );
}
