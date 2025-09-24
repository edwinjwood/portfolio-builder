import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import VirtualBC from './VirtualBC';

export default function PortfolioHome() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  // Carousel state (must be top-level for hooks)
  const [carouselIndex, _setCarouselIndex] = useState(0);
  const [_selected, _setSelected] = useState({ virtualbc: false, resume: false, projects: false });

  useEffect(() => {
    async function fetchPortfolio() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolios/${id}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`,
          },
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Error loading portfolio');
        } else {
          setPortfolio(await res.json());
        }
      } catch {
        setError('Network error');
      }
      setLoading(false);
    }
    fetchPortfolio();
  }, [id, currentUser]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-4">
      {loading ? (
        <div className="mt-12 text-lg">Loading portfolio...</div>
      ) : error ? (
        <div className="mt-12 text-red-600">{error}</div>
      ) : (
        <div className="w-full max-w-2xl mx-auto mt-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-2 text-center">{portfolio.name}</h1>
          <div className="mb-8 text-gray-500 dark:text-gray-400">Created: {portfolio.created_at}</div>
          {/* Components section */}
          <div className="w-full">
            <h2 className="text-lg font-semibold mb-2">Components</h2>
            {/* Show added components as previews here in future */}
            <div className="text-gray-400">No components yet. Add resume, business card, projects, etc.</div>
            <button
              className="mt-4 px-4 py-2 rounded bg-brand-600 text-white font-semibold hover:bg-brand-700"
              onClick={() => setShowModal(true)}
            >
              Add Components
            </button>
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-3 w-full max-w-xs sm:max-w-md mx-auto overflow-y-auto overflow-x-hidden max-h-[90vh]">
                  <h2 className="text-lg font-bold mb-3 text-center">Select Components</h2>
                  {/* Carousel picker for components */}
                  {/* Carousel picker for components */}
                  {/* Carousel picker for components */}
                  {(() => {
                    const components = [
                      {
                        key: 'virtualbc',
                        label: 'Virtual Business Card',
                        preview: <VirtualBC preview scale={0.4} data={{ title: 'Virtual Business Card', subtitle: 'Your professional profile', description: 'Contact info, links, and more.' }} />,
                      },
                      {
                        key: 'resume',
                        label: 'Resume',
                        preview: <div className="w-32 h-12 bg-gray-200 flex items-center justify-center rounded text-xs">Resume Preview</div>,
                      },
                      {
                        key: 'projects',
                        label: 'Projects',
                        preview: <div className="w-32 h-12 bg-gray-200 flex items-center justify-center rounded text-xs">Projects Preview</div>,
                      },
                    ];
                    const current = components[carouselIndex];
                    return (
                      <div className="flex flex-col items-center gap-2 mb-3">
                        <div className="flex flex-col items-center justify-center w-full overflow-hidden">
                          <div className="inline-flex flex-col items-center justify-center p-0 m-0">
                            <VirtualBC preview scale={0.3} data={{ title: 'Virtual Business Card', subtitle: 'Your professional profile', description: 'Contact info, links, and more.' }} />
                            <div className="text-xs text-gray-600 dark:text-gray-300 font-semibold m-0 p-0">{current.label}</div>
                            <div className="flex gap-2 justify-end w-full mt-1">
                              <button
                                className="px-3 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-sm hover:bg-gray-400 dark:hover:bg-gray-600"
                                onClick={() => setShowModal(false)}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-3 py-2 rounded bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700"
                                onClick={() => {
                                  setShowModal(false);
                                  // TODO: Add logic to actually add the component to the portfolio
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* ...existing code... */}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
