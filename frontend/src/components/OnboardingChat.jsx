import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';

const QUESTIONS = [
  {
    id: 'role',
    question: 'Which of these best describes you?',
    options: [
      { key: 'professional', label: 'Professional — I work in industry' },
      { key: 'student', label: 'Student — I am studying or recently graduated' },
      { key: 'both', label: 'Both — I study and work' },
    ],
  },
  {
    id: 'goal',
    question: 'What is your main goal for this portfolio?',
    options: [
      { key: 'job', label: 'Find a job or freelance work' },
      { key: 'showcase', label: 'Showcase projects and skills' },
      { key: 'learn', label: 'Practice & learn — building a public record' },
    ],
  },
  {
    id: 'audience',
    question: 'Who do you want to impress most?',
    options: [
      { key: 'recruiter', label: 'Recruiters / hiring managers' },
      { key: 'peers', label: 'Peers / other developers' },
      { key: 'clients', label: 'Potential clients / customers' },
    ],
  },
  {
    id: 'resume_exists',
    question: 'Do you have a current resume to upload?',
    options: [
      { key: 'yes', label: "Yes — I'll upload my resume" },
      { key: 'no', label: 'No — I do not have a resume' },
    ],
  },
];

export default function OnboardingChat() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);

  const current = QUESTIONS[step];

  // read template and name from querystring
  const qs = new URLSearchParams(location.search);
  const rawTemplate = qs.get('template');
  const nameFromQuery = qs.get('name') || 'New Portfolio';
  let templateId = null;
  if (rawTemplate) {
    const m = String(rawTemplate).match(/^\s*(\d+)/);
    if (m) templateId = parseInt(m[1], 10);
  }

  useEffect(() => {
    // scroll to top when step changes (small nicety)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  function chooseOption(key) {
    setError('');
    const next = [...answers, { id: current.id, value: key }];
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
      return;
    }
    // last answer -> create portfolio
    createPortfolio(next);
  }

  async function createPortfolio(finalAnswers) {
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: nameFromQuery,
        templateId: templateId || null,
        answers: finalAnswers,
      };
      if (resumeInfo) payload.resume = resumeInfo;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let txt = `Server error ${res.status}`;
        try { const j = await res.json(); txt = j && (j.error || j.message) ? (j.error || j.message) : JSON.stringify(j); } catch (_) { try { const t = await res.text(); if (t) txt = t; } catch (_) {} }
        setError(txt);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data && data.id) {
        // backend writes generated components to generated_components/<id>/...
        navigate(`/portfolio/${data.id}`);
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function uploadResume(file) {
    if (!file) return;
    setResumeUploading(true);
    setError('');
    try {
      // we'll just hold onto the file name and let server-side onboarding handle robust resume attachments
      setResumeInfo({ originalname: file.name });
    } catch (err) {
      setError(err.message || 'Upload error');
    } finally {
      setResumeUploading(false);
    }
  }

  const displayName = (currentUser && (currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`)) || 'there';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Hello {displayName}, let's answer some questions to get started</h1>
          <p className="text-sm text-gray-500 mb-4">These help us generate your Virtual Business Card and starter resume (if you don't have one).</p>

          <div className="mb-4">
            <div className="mb-2 text-sm text-gray-500">Question {step + 1} of {QUESTIONS.length}</div>
            <h2 className="text-lg font-semibold mb-3">{current.question}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {current.options.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => chooseOption(opt.key)}
                  className="text-left p-3 rounded border hover:shadow-sm bg-white dark:bg-gray-900"
                >
                  <div className="font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {current.id === 'resume_exists' && (
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Upload resume (optional)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => uploadResume(e.target.files[0])} />
              {resumeUploading && <div className="text-sm text-gray-600">Preparing resume...</div>}
              {resumeInfo && <div className="mt-2 text-sm text-green-600">Selected: {resumeInfo.originalname}</div>}
            </div>
          )}

          {loading && <div className="mt-3 text-sm text-gray-600">Creating your portfolio...</div>}
          {error && <div className="mt-3 text-red-600">{error}</div>}
        </div>
      </div>
    </main>
  );
}
