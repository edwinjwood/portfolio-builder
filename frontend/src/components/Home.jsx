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
  <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-brand-700 dark:text-brand-400">Facet</h1>
  <p className="text-xl text-gray-700 dark:text-gray-200 mb-4 font-semibold">Create your digital, shareable portfolio.</p>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
          Facet lets you build a beautiful online portfolio to showcase your experience, skills, and projects. Share your story with anyone, anywhere.
        </p>
        <div className="flex flex-col gap-6 items-center">
          <a
            href="#/portfolio-preview"
            className="px-6 py-3 bg-brand-600 text-white rounded-md hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 text-lg font-medium"
          >
            View Templates
          </a>
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
