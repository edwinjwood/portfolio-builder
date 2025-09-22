import React, { useState } from 'react';
import { useAuth } from '../features/user/context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [usernamePreview, setUsernamePreview] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  });
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const preselectedPlan = search.get('plan') || ''; 
  // Ensure we always have a plan for signup so backend can create a Checkout session.
  const planToUse = preselectedPlan || 'individual';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Basic client-side checks
    if (!Object.values(rules).every(Boolean)) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
  try {
    // Concatenate first + last to send as `name` so backend derives username and stores first/last names
    const fullName = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();
  // If user picked a username suggestion or the preview is available, forward it
  const usernameToSend = usernameAvailable ? usernamePreview : undefined;
  const res = await signup({ name: fullName, email, password, plan: planToUse, username: usernameToSend });
      // If signup returned without a checkout redirect, navigate to dashboard
      if (!res || !res.checkout) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const checkRules = (pw) => {
    const length = pw.length >= 8;
    const lower = /[a-z]/.test(pw);
    const upper = /[A-Z]/.test(pw);
    const number = /[0-9]/.test(pw);
    const special = /[^A-Za-z0-9]/.test(pw);
    setRules({ length, lower, upper, number, special });
  };

  // Build a slug-like preview from first/last/email
  const buildPreview = () => {
    const f = (firstName || '').trim();
    const l = (lastName || '').trim();
    let p = '';
    if (f && l) p = `${f}.${l}`;
    else if (f) p = f;
    else p = (email || '').split('@')[0] || '';
    p = p.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);
    return p;
  };

  // Debounced availability check
  React.useEffect(() => {
    const p = buildPreview();
    setUsernamePreview(p);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    if (!p) return;
    const id = setTimeout(async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/users/username-available?username=${encodeURIComponent(p)}`);
        if (!res.ok) { setUsernameAvailable(null); return; }
        const data = await res.json();
        setUsernameAvailable(!!data.available);
        setUsernameSuggestions(data.suggestions || []);
      } catch (e) {
        setUsernameAvailable(null);
      }
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, email]);

  return (
    <main className="w-full h-full grid place-items-center font-sans text-gray-900 dark:text-gray-100">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Sign up</h1>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">First name</label>
          <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} required className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <label className="block text-sm font-medium mb-1">Last name</label>
          <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} required className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        </div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" value={password} onChange={e=>{ setPassword(e.target.value); checkRules(e.target.value); }} required className="w-full mb-2 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        <label className="block text-sm font-medium mb-1">Confirm password</label>
        <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required className="w-full mb-3 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
        <div className="mb-3 text-sm">
          <div className="mb-2 font-semibold">Your public username</div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-gray-700 dark:text-gray-300">{usernamePreview || '—'}</div>
            {usernameAvailable === true && <div className="text-xs text-green-600">Available</div>}
            {usernameAvailable === false && <div className="text-xs text-red-600">Taken</div>}
          </div>
          {usernameSuggestions && usernameSuggestions.length > 0 && (
            <div className="text-xs text-gray-600">
              <div className="mb-1">Suggestions:</div>
              <div className="flex flex-wrap gap-2">
                {usernameSuggestions.map(s => (
                  <button type="button" key={s} onClick={() => { setUsernamePreview(s); setUsernameAvailable(true); setUsernameSuggestions([]); }} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700">{s}</button>
                ))}
              </div>
            </div>
          )}
        
          <div className="font-semibold mb-1">Password rules</div>
          <ul className="list-none pl-0 text-sm">
            <li className={`flex items-center gap-2 ${rules.length ? 'text-green-600' : 'text-gray-600'}`}><span className="w-4 h-4 inline-block" aria-hidden>{rules.length ? '✔' : '○'}</span>At least 8 characters</li>
            <li className={`flex items-center gap-2 ${rules.lower ? 'text-green-600' : 'text-gray-600'}`}><span className="w-4 h-4 inline-block" aria-hidden>{rules.lower ? '✔' : '○'}</span>One lowercase letter</li>
            <li className={`flex items-center gap-2 ${rules.upper ? 'text-green-600' : 'text-gray-600'}`}><span className="w-4 h-4 inline-block" aria-hidden>{rules.upper ? '✔' : '○'}</span>One uppercase letter</li>
            <li className={`flex items-center gap-2 ${rules.number ? 'text-green-600' : 'text-gray-600'}`}><span className="w-4 h-4 inline-block" aria-hidden>{rules.number ? '✔' : '○'}</span>One number</li>
            <li className={`flex items-center gap-2 ${rules.special ? 'text-green-600' : 'text-gray-600'}`}><span className="w-4 h-4 inline-block" aria-hidden>{rules.special ? '✔' : '○'}</span>One special character (e.g. !@#$%)</li>
          </ul>
        </div>
  <button type="submit" disabled={loading || !Object.values(rules).every(Boolean) || password !== confirmPassword} className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">{loading ? 'Creating…' : `Create account & ${planToUse ? 'Start' : 'Create account'}`}</button>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Have an account? <Link to="/login" className="text-brand-600">Sign in</Link></div>
      </form>
    </main>
  );
}

export default Signup;
