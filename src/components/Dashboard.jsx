import React from 'react';
import { useAuth } from '../features/user/context/AuthContext';
import { useTenant } from '../contexts/TenantContext';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { tenant, user } = useTenant();
  const isStarter = user && user.subscription?.plan === 'Starter';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-lg mx-0 mt-12 ml-8 flex flex-col items-start">
        <h1 className="text-xl font-bold mb-4">
          Welcome, {user?.name || user?.email}!<br />
          {tenant ? `Institution: ${tenant.name}` : null}
        </h1>
        <button
          className={`h-10 w-10 rounded-lg border-2 border-dashed border-brand-500 flex items-center justify-center text-brand-600 bg-brand-50 dark:bg-brand-900 hover:bg-brand-100 dark:hover:bg-brand-800 transition ${isStarter ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isStarter ? 'Upgrade to add more portfolios' : 'Add Portfolio'}
          disabled={isStarter}
          onClick={() => {
            if (!isStarter) {
              // Add portfolio logic here
              alert('Portfolio creation coming soon!');
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </main>
  );
}
