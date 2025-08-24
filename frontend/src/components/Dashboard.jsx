import React, { useState, useEffect } from 'react';
import ResumePreview from '../templates/classic/ResumePreview';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import previewComponents from '../templates/templateMap';


export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { tenant, user } = useTenant();
  const isStarter = user && user.subscription?.plan === 'Starter';
  const [portfolios, setPortfolios] = useState([]);
  // Fetch portfolios from backend after login
  useEffect(() => {
    async function fetchPortfolios() {
      if (!currentUser?.token) return;
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
    }
    fetchPortfolios();
  }, [currentUser]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [portfolioName, setPortfolioName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modalStep, setModalStep] = useState(0); // 0: template, 1: name
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);

  // Preload templates when dashboard mounts
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/templates`);
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (err) {
        // handle error
      }
    }
    fetchTemplates();
  }, []);

  const navigate = useNavigate();

  const handleCreatePortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ name: portfolioName, template: selectedTemplate })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error creating portfolio');
      } else {
        const newPortfolio = await res.json();
        setShowModal(false);
        setPortfolioName('');
        setSelectedTemplate('classic');
        setModalStep(0);
        // Redirect to PortfolioHome with new portfolio ID
        navigate(`/portfolio/${newPortfolio.id}`);
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  };


  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-full flex flex-col items-center mt-4 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center w-full">
                Welcome{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}!
                {tenant ? <span className="block text-base font-normal text-gray-500 dark:text-gray-400">Institution: {tenant.name}</span> : null}
              </h1>
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-brand-500 text-brand-600 bg-brand-50 dark:bg-brand-900 hover:bg-brand-100 dark:hover:bg-brand-800 transition font-bold text-base sm:text-lg mt-2 w-full sm:w-auto justify-center ${isStarter && portfolios.length >= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isStarter && portfolios.length >= 1 ? 'Upgrade to add more portfolios' : 'Add Portfolio'}
            disabled={isStarter && portfolios.length >= 1}
            onClick={() => {
              if (!(isStarter && portfolios.length >= 1)) {
                setShowModal(true);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Portfolio
          </button>
        </div>

        <div className="w-full flex flex-col items-center">

          {/* Modal for creating portfolio with template selection */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-lg mx-auto">
                <h2 className="text-xl font-bold mb-4">Create Portfolio</h2>
                {modalStep === 0 && (
                  <>
                    <div className="mb-4">
                      <div className="font-semibold mb-2">Choose a template</div>
                      <div className={`grid gap-4 max-h-[70vh] overflow-y-auto ${templates.length > 1 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                        {templates.length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8 w-full col-span-3">No templates available.</div>
                        ) : (
                          templates.map(t => {
                            const PreviewComponent = previewComponents[t.preview_component] || (() => <div>No preview</div>);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                className={`border rounded-lg p-3 flex flex-col items-center gap-2 transition focus:outline-none w-full ${selectedTemplate===t.id ? 'border-brand-600 ring-2 ring-brand-400' : 'border-gray-300 dark:border-gray-700'}`}
                                onClick={() => setSelectedTemplate(t.id)}
                              >
                                <div className="font-bold text-base mb-1">{t.name}</div>
                                <div className="text-xs text-gray-500 mb-2">{t.description}</div>
                                <PreviewComponent data={t} />
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                      <button
                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                        onClick={() => setShowModal(false)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-brand-600 text-white font-semibold hover:bg-brand-700"
                        onClick={() => setModalStep(1)}
                        disabled={loading}
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
                {modalStep === 1 && (
                  <>
                    <label className="block mb-2 font-semibold">Portfolio Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                      value={portfolioName}
                      onChange={e => setPortfolioName(e.target.value)}
                      placeholder="Portfolio Name"
                      disabled={loading}
                    />
                    {error && <div className="text-red-600 mb-2">{error}</div>}
                    <div className="flex gap-2 justify-end mt-4">
                      <button
                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
                        onClick={() => setModalStep(0)}
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-brand-600 text-white font-semibold hover:bg-brand-700"
                        onClick={handleCreatePortfolio}
                        disabled={loading || !portfolioName}
                      >
                        {loading ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {portfolios.length > 0 && (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md text-sm sm:text-base">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left">Name</th>
                    <th className="px-2 py-2 text-left">Created</th>
                    <th className="px-2 py-2 text-left">Components</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map((portfolio) => (
                    <tr key={portfolio.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-2 py-2 font-semibold break-words max-w-[120px]">{portfolio.name}</td>
                      <td className="px-2 py-2">{portfolio.created}</td>
                      <td className="px-2 py-2 break-words max-w-[120px]">{portfolio.components?.join(', ')}</td>
                      <td className="px-2 py-2 flex gap-1 sm:gap-2 flex-wrap">
                        <button
                          className="px-2 py-1 rounded bg-blue-600 text-white text-xs sm:text-sm hover:bg-blue-700"
                          onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                        >
                          View
                        </button>
                        <button className="px-2 py-1 rounded bg-green-600 text-white text-xs sm:text-sm hover:bg-green-700">Edit</button>
                        <button className="px-2 py-1 rounded bg-gray-400 text-white text-xs sm:text-sm hover:bg-gray-500">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
