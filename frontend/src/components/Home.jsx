import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';


function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleStartBuilding = () => {
    if (!currentUser) {
      navigate('/login');
    }
    // If logged in, do nothing (or add logic if needed)
  };

  return (
    <main className="w-full h-full grid place-items-center font-sans text-gray-900 dark:text-gray-100 px-4 sm:px-8">
      <div className="text-center">
  <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-brand-700 dark:text-brand-400 facet-wordmark">facet</h1>
  <p className="text-xl text-gray-700 dark:text-gray-200 mb-4 font-semibold">There's more to you than just a resume.</p>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
          Showcase your many facets with a digital portfolio. Highlight projects, skills, and stories — all in one place.
        </p>
        <div className="flex flex-col gap-6 items-center">
          <button
            onClick={handleStartBuilding}
            className="px-6 py-3 border border-brand-600 text-brand-700 dark:text-brand-300 rounded-md hover:bg-brand-50/60 dark:hover:bg-gray-800 text-lg font-medium"
          >
            Get Started
          </button>
        </div>
      </div>
    </main>
  );
}

export default Home;
