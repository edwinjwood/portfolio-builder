import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';

export default function OptimizerAnalyze() {
  const { resumeId } = useParams();
  const { getToken } = useAuth();
  const [status, setStatus] = useState('queued');
  const [starting, setStarting] = useState(false);
  const api = import.meta.env.VITE_API_URL || '';
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    const start = async () => {
      setStarting(true);
      try {
        const res = await fetch(`${api}/api/resumes/${resumeId}/analyze`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data = await res.json();
        if (!ignore) {
          setStatus(data.status || 'queued');
          if (data.status === 'done') {
            setTimeout(()=> navigate(`/optimizer/results/${resumeId}`), 600);
          }
        }
      } finally { setStarting(false); }
    };
    start();
    return () => { ignore = true; };
  }, [resumeId]);

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Analyzing Resume</h1>
      <p>Status: {starting ? 'starting...' : status}</p>
    </div>
  );
}
