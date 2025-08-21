import React, { useState } from 'react';
import { useAuth } from '../features/user/context/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { Link, useNavigate } from 'react-router-dom';
import tenants from '../data/tenants.json';

function Login() {
  const { login, resetDemo, users } = useAuth();
  const { setTenant, setUser } = useTenant();
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
      const user = await login({ email, password });
      // Find tenant for user
      const userObj = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      const tenantObj = tenants.find(t => t.id === userObj.tenantId);
      setTenant(tenantObj || null);
      setUser(userObj || null);
      if (userObj && userObj.role === 'superadmin') {
        navigate('/tenant-admin');
      } else if (userObj && userObj.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
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
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs" onClick={()=>{ setEmail('superadmin@platform.io'); setPassword('password'); }}>Platform Superadmin (All Tenants)</button>
          <button type="button" className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs" onClick={()=>{ setEmail('admin@bootcamp.io'); setPassword('password'); }}>Bootcamp Admin (Tenant Admin, tenant-002)</button>
          <button type="button" className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs" onClick={()=>{ setEmail('demo@example.com'); setPassword('password'); }}>Demo Admin (Tenant Admin, tenant-001)</button>
          <button type="button" className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs" onClick={()=>{ setEmail('pro@example.com'); setPassword('password'); }}>Pro User (Tenant User, tenant-001)</button>
          <button type="button" className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs" onClick={()=>{ setEmail('elite@example.com'); setPassword('password'); }}>Elite User (Tenant User, tenant-002)</button>
          <button type="button" className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs" onClick={()=>{ setEmail('individual@example.com'); setPassword('password'); }}>Individual User (No Tenant)</button>
        </div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full mb-4 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}</button>
  {/* Removed reset demo data button */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">No account? <Link to="/signup" className="text-brand-600">Sign up</Link></div>
      </form>
    </main>
  );
}

export default Login;
