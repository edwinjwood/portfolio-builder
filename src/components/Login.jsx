import React, { useState } from 'react';
import { useAuth } from '../features/user/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const { login, resetDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full h-full grid place-items-center font-sans text-gray-900 dark:text-gray-100">
  <form onSubmit={onSubmit} className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}</button>
        <div className="flex items-center justify-between mt-3">
          <button type="button" onClick={async()=>{ await resetDemo(); setEmail('demo@example.com'); setPassword('password'); setError(''); }} className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300">Reset demo data</button>
          <button type="button" onClick={()=>{ setEmail('demo@example.com'); setPassword('password'); }} className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300">Use demo creds</button>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">No account? <Link to="/signup" className="text-brand-600">Sign up</Link></div>
      </form>
    </main>
  );
}

export default Login;
