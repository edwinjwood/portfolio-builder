import React, { useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../features/user/context/AuthContext';

export default function AdminDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('institution');
  const { tenant, user, setTenant } = useTenant();
  const { users } = useAuth();
  const [primaryColor, setPrimaryColor] = useState(tenant?.theme?.primaryColor || '#73000A');
  const [secondaryColor, setSecondaryColor] = useState(tenant?.theme?.secondaryColor || '#C10230');
  const [logoUrl, setLogoUrl] = useState(tenant?.theme?.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState(tenant?.theme?.logoUrl || '');
  const [logoFile, setLogoFile] = useState(null);

  if (!user || user.role !== 'admin') {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-700 dark:text-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You must be a tenant admin to view this page.</p>
        </div>
      </main>
    );
  }

  // Filter students for this tenant
  const students = users.filter(u => u.tenantId === tenant?.id && u.role === 'user');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (logoFile) {
      const formData = new FormData();
      formData.append('logo', logoFile);
      fetch(`http://localhost:5001/api/upload-logo?tenantId=${tenant.id}`, {
        method: 'POST',
        body: formData,
      })
        .then(res => res.json())
        .then(data => {
          setLogoUrl(data.logoUrl);
          setTenant({
            ...tenant,
            theme: {
              ...tenant.theme,
              primaryColor,
              secondaryColor,
              logoUrl: data.logoUrl,
            },
          });
          alert('Tenant theme and logo updated!');
        })
        .catch(err => {
          alert('Error uploading logo: ' + err.message);
        });
    } else {
      setTenant({
        ...tenant,
        theme: {
          ...tenant.theme,
          primaryColor,
          secondaryColor,
          logoUrl: logoUrl || tenant.theme.logoUrl,
        },
      });
      alert('Tenant theme updated!');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Mobile Hamburger in NavBar */}
      <div className="md:hidden fixed top-16 left-0 w-full z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 py-2">
        <button onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Open admin menu" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-4 text-lg font-bold">{tenant?.name} Admin</span>
      </div>
      {/* Drawer for mobile */}
      {drawerOpen && (
        <div className="md:hidden fixed top-24 left-0 w-full bg-white dark:bg-gray-800 shadow-lg z-40">
          <nav className="flex flex-col gap-2 p-4">
            <button onClick={() => { setActiveSection('institution'); setDrawerOpen(false); }} className={`text-left px-4 py-3 rounded font-semibold transition text-lg ${activeSection === 'institution' ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Institution Info</button>
            <button onClick={() => { setActiveSection('users'); setDrawerOpen(false); }} className={`text-left px-4 py-3 rounded font-semibold transition text-lg ${activeSection === 'users' ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Manage Users</button>
            <button onClick={() => { setActiveSection('analytics'); setDrawerOpen(false); }} className={`text-left px-4 py-3 rounded font-semibold transition text-lg ${activeSection === 'analytics' ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Analytics</button>
          </nav>
        </div>
      )}
      <div className="flex">
        {/* Fixed Sidebar for desktop */}
        <aside className="hidden md:flex fixed md:top-16 md:left-0 md:h-[calc(100vh-4rem)] md:w-72 bg-white dark:bg-gray-800 shadow-lg md:p-8 flex-col gap-6 z-20">
          <h1 className="text-2xl font-bold mb-8">{tenant?.name} Admin</h1>
          <nav className="flex flex-col w-full">
            <button onClick={() => setActiveSection('institution')} className={`text-left px-4 py-3 rounded font-semibold transition text-lg ${activeSection === 'institution' ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Institution Info</button>
            <button onClick={() => setActiveSection('users')} className={`text-left px-4 py-3 rounded font-semibold transition text-lg ${activeSection === 'users' ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Manage Users</button>
            <button onClick={() => setActiveSection('analytics')} className={`text-left px-4 py-3 rounded font-semibold transition text-lg ${activeSection === 'analytics' ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Analytics</button>
          </nav>
        </aside>
        {/* Main Content */}
  <div className="flex-1 ml-0 md:ml-72 pl-0 pr-4 py-8 flex flex-col items-start">
          {activeSection === 'institution' && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Institution Info</h2>
              <div className="mb-4 text-lg">Domain: <span className="font-mono text-base">{tenant?.domain}</span></div>
              <div className="mb-6 flex flex-wrap gap-8 items-center">
                <div>
                  <label className="block text-base font-medium mb-2">Logo</label>
                  <input type="file" accept="image/*" onChange={handleLogoChange} />
                  {logoPreview && <img src={logoPreview} alt="Logo preview" className="h-16 mt-4 rounded shadow" />}
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Primary Color</label>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 p-0 border-none" />
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">Secondary Color</label>
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-12 p-0 border-none" />
                </div>
              </div>
              <button onClick={handleSave} className="mt-6 px-6 py-3 rounded bg-brand-600 text-white font-semibold text-lg hover:bg-brand-700">Save Changes</button>
            </section>
          )}
          {activeSection === 'users' && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Manage Users</h2>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Registered Students</h3>
                {students.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-300">No students registered yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {students.map(s => (
                      <li key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-medium text-base">{s.name || s.email}</span>
                        <span className="text-xs text-gray-500">{s.email}</span>
                        <span className="text-xs text-gray-400">Joined: {new Date(s.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
          {activeSection === 'analytics' && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Analytics</h2>
              <p className="text-gray-600 dark:text-gray-300">(Analytics features coming soon)</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
