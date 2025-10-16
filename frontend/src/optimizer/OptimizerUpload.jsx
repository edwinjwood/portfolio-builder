import React, { useState } from 'react';
import { useAuth } from '../features/user/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function OptimizerUpload() {
  const { getToken } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API_URL || '';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${api}/api/resumes`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: fd });
      const data = await res.json();
      if (res.ok) {
        navigate(`/optimizer/analyze/${data.id}`);
      } else {
        alert(data.error || 'Upload failed');
      }
    } finally { setUploading(false); }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Upload Resume</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e)=>setFile(e.target.files[0])} />
        <div className="flex gap-2">
          <button disabled={uploading || !file} className="px-4 py-2 rounded bg-brand-600 text-white">Upload</button>
          <button type="button" disabled={uploading} onClick={async ()=>{
            setUploading(true);
            try {
              const res = await fetch(`${api}/api/resumes/new-from-profile`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }});
              const data = await res.json();
              if (res.ok) {
                navigate(`/optimizer/results/${data.id}`);
              } else {
                alert(data.error || 'Failed to generate from profile');
              }
            } finally {
              setUploading(false);
            }
          }} className="px-4 py-2 rounded border">Make new from Profile</button>
        </div>
      </form>
    </div>
  );
}
