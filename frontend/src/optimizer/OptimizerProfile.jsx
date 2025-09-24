import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';

export default function OptimizerProfile() {
  const { currentUser, getToken } = useAuth();
  const [form, setForm] = useState({ degree:'', target_title:'', target_industry:'', strengths:'', about:'', certs:[], accomplishments:[] });
  const [saving, setSaving] = useState(false);
  const api = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    let ignore = false;
    const toArr = (v) => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(',').map(s=>s.trim()).filter(Boolean) : []);
    const load = async () => {
      try {
        const res = await fetch(`${api}/api/me/profile`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (!ignore && res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length) setForm({
            degree: data.degree || '',
            target_title: data.target_title || '',
            target_industry: data.target_industry || '',
            strengths: data.strengths || '',
            about: data.about || '',
            certs: toArr(data.certs_json),
            accomplishments: toArr(data.accomplishments_json)
          });
        }
      } catch {}
    };
    if (currentUser) load();
    return () => { ignore = true; };
  }, [currentUser?.id, currentUser, api, getToken]);

  const onSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch(`${api}/api/me/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(form)
      });
      if (res.ok) alert('Saved');
    } finally { setSaving(false); }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Resume Optimizer — Profile</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Degree</label>
          <input type="text" className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={form.degree} onChange={e=>setForm({...form, degree:e.target.value})} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Target Title</label>
            <input type="text" className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={form.target_title} onChange={e=>setForm({...form, target_title:e.target.value})} />
          </div>
          <div>
            <label className="block font-semibold">Target Industry</label>
            <input type="text" className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={form.target_industry} onChange={e=>setForm({...form, target_industry:e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block font-semibold">Strengths</label>
          <textarea className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" rows={3} value={form.strengths} onChange={e=>setForm({...form, strengths:e.target.value})} />
        </div>
        <div>
          <label className="block font-semibold">About</label>
          <textarea className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" rows={4} value={form.about} onChange={e=>setForm({...form, about:e.target.value})} />
        </div>
        <div>
          <label className="block font-semibold">Certifications (comma-separated)</label>
          <input type="text" className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={Array.isArray(form.certs) ? form.certs.join(', ') : (typeof form.certs === 'string' ? form.certs : '')} onChange={e=>setForm({...form, certs: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
        </div>
        <div>
          <label className="block font-semibold">Accomplishments (comma-separated)</label>
          <input type="text" className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={Array.isArray(form.accomplishments) ? form.accomplishments.join(', ') : (typeof form.accomplishments === 'string' ? form.accomplishments : '')} onChange={e=>setForm({...form, accomplishments: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">Save</button>
          <Link to="/optimizer/upload" className="px-4 py-2 rounded border">Next: Upload</Link>
        </div>
      </form>
    </div>
  );
}
