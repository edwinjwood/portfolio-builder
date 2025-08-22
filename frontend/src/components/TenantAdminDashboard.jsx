import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/user/context/AuthContext';
import tenantsData from '../data/tenants.json';


export default function TenantAdminDashboard() {
  const { currentUser } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', licenseCount: 1 });

  useEffect(() => {
    setTenants(tenantsData);
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddTenant = e => {
    e.preventDefault();
    setTenants([...tenants, { ...form, id: Date.now().toString() }]);
    setShowForm(false);
    setForm({ name: '', domain: '', licenseCount: 1 });
    // TODO: Persist to backend or tenants.json
  };

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-700 dark:text-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You must be a platform superadmin to view this page.</p>
        </div>
      </main>
    );
  }

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Tenant Management</h1>
      <button className="mb-6 px-4 py-2 rounded bg-brand-600 text-white font-semibold" onClick={() => setShowForm(true)}>Onboard New Tenant</button>
      {showForm && (
        <form className="mb-8 p-6 bg-white dark:bg-gray-800 rounded shadow" onSubmit={handleAddTenant}>
          <h2 className="text-xl font-bold mb-4">Onboard Tenant</h2>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 rounded border" required />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Domain</label>
            <input name="domain" value={form.domain} onChange={handleChange} className="w-full px-3 py-2 rounded border" required />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">License Count</label>
            <input name="licenseCount" type="number" min="1" value={form.licenseCount} onChange={handleChange} className="w-32 px-3 py-2 rounded border" required />
          </div>
          <button type="submit" className="px-6 py-2 rounded bg-brand-700 text-white font-semibold">Add Tenant</button>
          <button type="button" className="ml-4 px-6 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}
      <section>
        <h2 className="text-xl font-bold mb-4">All Tenants</h2>
        <table className="w-full border rounded shadow bg-white dark:bg-gray-800">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Domain</th>
              <th className="p-3 text-left">License Count</th>
              <th className="p-3 text-left">Licenses Available</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => {
              const activeUsers = users.filter(u => u.tenantid === t.id && u.subscription && u.subscription.status === 'active');
              const licensesAvailable = t.licenseCount - activeUsers.length;
              return (
                <tr key={t.id} className="border-t">
                  <td className="p-3 font-semibold">{t.name}</td>
                  <td className="p-3">{t.domain}</td>
                  <td className="p-3">{t.licenseCount}</td>
                  <td className="p-3">{licensesAvailable}</td>
                  <td className="p-3">
                    <button className="px-3 py-1 rounded bg-brand-500 text-white text-xs font-semibold mr-2">Edit</button>
                    <button className="px-3 py-1 rounded bg-red-500 text-white text-xs font-semibold">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
