import React, { useState, useEffect } from 'react';
import Resume from '../components/Resume';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import previewComponents from '../templates/templateMap';
import defaultResume from '../templates/classic/resume.json';


export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { tenant, user } = useTenant();
  const isStarter = user && user.subscription?.plan === 'Starter';
  const [portfolios, setPortfolios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalStep, setModalStep] = useState(0);
  const [portfolioName, setPortfolioName] = useState('');
  const navigate = useNavigate();

  // Fetch portfolios from backend after login
  useEffect(() => {
    const fetchPortfolios = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolios`, {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPortfolios(data);
        } else {
          setPortfolios([]);
        }
      } catch {
        setPortfolios([]);
      }
      setLoading(false);
    };

    if (currentUser) {
      fetchPortfolios();
    }
  }, [currentUser]);

  // Fetch available templates for previews (populate carousel and grid)
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/templates`);
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        } else {
          setTemplates([]);
        }
      } catch (err) {
        console.error('Failed to load templates', err);
        setTemplates([]);
      }
    };

    fetchTemplates();
  }, []);

  const handleOpenDeleteModal = (portfolio) => {
    setPortfolioToDelete(portfolio);
    setDeleteInput('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (deleteInput !== portfolioToDelete.name) {
      setDeleteError('Portfolio name does not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolios/${portfolioToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      if (res.ok) {
        setPortfolios(portfolios.filter(p => p.id !== portfolioToDelete.id));
        setShowDeleteModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove modal logic and conditionally render dashboard content
  // Prepare templates to render: show mock variants when backend returns none or only one
  const renderedTemplates = (() => {
    const variants = [
      { key: 'classic', name: 'Classic', desc: 'A classic resume template' },
      { key: 'modern', name: 'Modern', desc: 'A modern, clean layout' },
      { key: 'minimal', name: 'Minimal', desc: 'Minimal and focused' },
      { key: 'creative', name: 'Creative', desc: 'Creative layout with color' },
      { key: 'professional', name: 'Professional', desc: 'Conservative & professional' },
      { key: 'simple', name: 'Simple', desc: 'Quick, printable layout' },
      { key: 'bold', name: 'Bold', desc: 'Strong headings and contrast' },
      { key: 'elegant', name: 'Elegant', desc: 'Refined, spacious layout' },
    ];

    if (!templates || templates.length === 0) {
      return variants.map((v, i) => ({ id: `mock-${v.key}`, name: v.name, description: v.desc, defaults: { resume: { name: ['John Doe','Jane Doe','Alex Smith','Sam Taylor'][i % 4], title: ['Engineer','Designer','Manager','Developer'][i % 4], summary: `Sample summary for ${v.name}.` } } }));
    }

    if (templates.length === 1) {
      const base = templates[0];
      return variants.map((v, i) => ({ ...base, id: `${base.id}-v${i}`, name: `${base.name} — ${v.name}`, description: v.desc }));
    }

    return templates;
  })();

  return (
    <main onClick={() => setSelectedTemplate(null)} className="w-full h-full font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8" />
  {/* Carousel removed per request; storefront grid shown below */}
        {/* If user has no portfolios, show template selection storefront grid */}
        {portfolios.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8 w-full" onClick={() => setSelectedTemplate(null)}>
            {renderedTemplates.map((t, idx) => {
              const accents = ['#FDE68A','#BFDBFE','#FECACA','#D1FAE5','#E9D5FF','#C7F9FF','#FDE68A','#E6E6E6'];
              const accent = accents[idx % accents.length];
              // Use the canonical defaultResume and merge in any template-provided overrides
              const thumbData = {
                ...defaultResume,
                ...(t.defaults?.resume || {}),
              };
              // Only show thumbnail preview for the first card when the backend returned exactly one template
              const showPreview = (templates && templates.length === 1) ? idx === 0 : true;
              return (
                <div
                  key={t.id}
                  className={`rounded-lg p-4 flex flex-col items-center gap-4 transition focus:outline-none bg-white dark:bg-gray-800 shadow hover:shadow-lg ${idx === 0 ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'} ${selectedTemplate===t.id ? 'ring-2 ring-brand-400' : ''}`}
                  style={{minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', border: `1px solid ${accent}33`}}
                  onClick={e => { e.stopPropagation(); if (idx === 0) setSelectedTemplate(t.id); }}
                  aria-disabled={idx === 0 ? 'false' : 'true'}
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="font-bold text-base mb-1 text-left">{t.name}</div>
                    <div className="flex items-center gap-2">
                      <div style={{width:20,height:20,background: idx === 0 ? accent : '#cbd5e1',borderRadius:6,border:`1px solid ${idx === 0 ? accent + '88' : '#94a3b8'}`}} />
                      {idx !== 0 && <div className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Coming soon</div>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2 text-left w-full">{t.description}</div>
                  <div style={{width: '100%', flex: '1 1 auto', minHeight: 0, borderRadius: 8, overflow: 'hidden', background: accent + '10', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {/* Lightweight storefront thumbnail */}
                    <div style={{width: '100%', height: '100%', padding: '8px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                      <div className="w-full rounded bg-white dark:bg-gray-900 border" style={{ height: 360, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: 6, paddingLeft: 8, pointerEvents: 'none', overflow: 'hidden' }}>
                          {/* Treat the preview square like a small screen and render the resume responsively inside it */}
                          <div className="template-preview-frame" style={{ width: '100%' }}>
                            {showPreview ? (
                              <Resume data={thumbData} hideActions preview />
                            ) : (
                              // empty preview placeholder to preserve tile sizing
                              <div className="template-preview-empty" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedTemplate === t.id && (
                    <form className="w-full flex flex-col items-center justify-center mt-4" onSubmit={async e => {
                      e.preventDefault();
                      if (!portfolioName || !selectedTemplate) return;
                      setLoading(true);
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolios`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${currentUser.token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ name: portfolioName, templateId: selectedTemplate })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setPortfolioName('');
                          setSelectedTemplate(null);
                          navigate(`/portfoliohome/${data.id}`);
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}>
                      <label className="block font-semibold mb-2 text-left w-full">Portfolio Name</label>
                      <input
                        type="text"
                        className="w-full max-w-xs border rounded px-3 py-2 mb-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 mx-auto"
                        value={portfolioName}
                        onChange={e => setPortfolioName(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-brand-600 text-white font-semibold hover:bg-brand-700 w-full max-w-xs mx-auto"
                        disabled={loading || !portfolioName}
                      >
                        Create Portfolio
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {portfolios.length > 0 && (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md text-sm sm:text-base">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left">Name</th>
                      <th className="px-2 py-2 text-left">Created</th>
                      <th className="px-2 py-2 text-left">Components</th>
                      <th className="px-2 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolios.map((portfolio) => (
                      <tr key={portfolio.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-2 py-2 font-semibold break-words max-w-[120px]">{portfolio.name}</td>
                        <td className="px-2 py-2">{portfolio.created}</td>
                        <td className="px-2 py-2 break-words max-w-[120px]">{portfolio.components?.join(', ')}</td>
                        <td className="px-2 py-2 flex gap-1 sm:gap-2 flex-wrap justify-center">
                          <button
                            className="px-2 py-1 rounded bg-blue-600 text-white text-xs sm:text-sm hover:bg-blue-700"
                            onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                          >
                            View
                          </button>
                          <button className="px-2 py-1 rounded bg-green-600 text-white text-xs sm:text-sm hover:bg-green-700">Edit</button>
                          <button className="px-2 py-1 rounded bg-gray-400 text-white text-xs sm:text-sm hover:bg-gray-500" onClick={() => handleOpenDeleteModal(portfolio)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Delete portfolio</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">This action cannot be undone. To confirm deletion, type the portfolio name <span className="font-medium">{portfolioToDelete?.name}</span> below.</p>
            {deleteError && <div className="text-sm text-red-600 mb-2">{deleteError}</div>}
            <form onSubmit={handleConfirmDelete} className="flex flex-col gap-3">
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="Type portfolio name to confirm"
                required
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteInput(''); setDeleteError(''); }} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Cancel</button>
                <button type="submit" disabled={loading || deleteInput !== portfolioToDelete?.name} className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-60">Delete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
