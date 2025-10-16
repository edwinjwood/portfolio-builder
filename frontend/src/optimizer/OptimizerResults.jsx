import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import ResumeTemplateClassic from './ResumeTemplateClassic';
import ResumeTemplateCSCE from './ResumeTemplateCSCE';
import ResumeTemplateDomain from './ResumeTemplateDomain';

export default function OptimizerResults() {
  const { resumeId } = useParams();
  const { getToken } = useAuth();
  const [result, setResult] = useState(null);
  const api = import.meta.env.VITE_API_URL || '';

  const [profile, setProfile] = useState(null);
  const [style, setStyle] = useState('classic');
  const [applied, setApplied] = useState({ extraSkills: [], extraBullets: [], md: null });
  const [autoStyle, setAutoStyle] = useState(true);
  const [domain, setDomain] = useState(null);
  const [domainOverride, setDomainOverride] = useState('');

  useEffect(() => {
    let ignore = false;

    const poll = async () => {
      if (ignore) return;
      try {
        const r1 = await fetch(`${api}/api/resumes/${resumeId}/result`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (r1.ok) {
          const data1 = await r1.json();
          if (ignore) return;
          setResult(data1);
          setDomain(data1?.domain || null);
        } else {
          setTimeout(poll, 1500);
        }
      } catch {
        setTimeout(poll, 2000);
      }
    };

    const loadProfile = async () => {
      try {
        const r2 = await fetch(`${api}/api/me/profile`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data2 = await r2.json().catch(()=>null);
        if (!ignore && r2.ok) {
          setProfile(data2);
        }
      } catch {}
    };

    loadProfile();
    poll();
    return () => { ignore = true; };
  }, [resumeId, api, getToken]);

  // Hooks that depend on result must still be declared unconditionally
  const md = applied.md ?? (result?.generated?.markdown ?? '');
  const mdHtml = useMemo(() => {
    try { return marked.parse(md || ''); } catch { return md || ''; }
  }, [md]);
  const resumeRef = useRef(null);
  useEffect(() => {
    if (result?.generated?.markdown) {
      setApplied(prev => {
        if (prev.md) return prev;
        return { ...prev, md: result.generated.markdown };
      });
    }
  }, [result?.generated?.markdown]);
  const downloadMd = () => {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_resume.md';
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadPdf = async () => {
    if (!resumeRef.current) return;
    const opt = {
      margin:       0.5,
      filename:     'optimized_resume.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    await html2pdf().set(opt).from(resumeRef.current).save();
  };

  const domainForView = domainOverride || domain || null;
  const resultForView = useMemo(() => {
    if (!domainOverride) return result;
    // Presentational override: keep original result, but replace domain and embedded structure domain
    return {
      ...result,
      domain: domainOverride,
      generated: {
        ...(result?.generated || {}),
        structure: { ...(result?.generated?.structure || {}), domain: domainOverride }
      }
    };
  }, [result, domainOverride]);

  if (!result) return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Results</h1>
      <p>Awaiting results...</p>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Results</h1>
      <div className="mb-3 text-xs text-gray-500">Domain: {domainForView || 'n/a'}</div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Industry Resume</h2>
          <div className="flex items-center gap-2 text-sm">
            <span>Style:</span>
            <button className={`px-2 py-1 rounded border ${style==='classic'?'bg-gray-200':''}`} onClick={()=>{setStyle('classic'); setAutoStyle(false);}}>Classic</button>
            <button className={`px-2 py-1 rounded border ${style==='csce'?'bg-gray-200':''}`} onClick={()=>{setStyle('csce'); setAutoStyle(false);}}>CS/CE Standard</button>
            <button className={`px-2 py-1 rounded border ${style==='domain'?'bg-gray-200':''}`} onClick={()=>{setStyle('domain'); setAutoStyle(false);}}>Domain Standard{domainForView?` (${domainForView})`:''}</button>
            <label className="ml-3 text-xs text-gray-600 dark:text-gray-300">Override:</label>
            <select
              className="text-sm border rounded px-2 py-1 bg-white text-gray-900 border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={domainOverride}
              onChange={(e)=>setDomainOverride(e.target.value)}
            >
              <option value="">auto</option>
              <option value="engineering">engineering</option>
              <option value="csce">csce</option>
              <option value="mechanical">mechanical</option>
              <option value="electrical">electrical</option>
              <option value="civil">civil</option>
              <option value="business">business</option>
              <option value="accounting">accounting</option>
              <option value="banking">banking</option>
              <option value="hr">hr</option>
              <option value="aviation">aviation</option>
              <option value="designer">designer</option>
              <option value="construction">construction</option>
              <option value="chef">chef</option>
              <option value="nursing">nursing</option>
            </select>
          </div>
        </div>
        <div ref={resumeRef} className="bg-white text-black p-6 rounded border shadow-sm">
          {style==='classic' ? (
            <ResumeTemplateClassic user={{ email: (resultForView?.user_email || undefined) }} profile={profile || {}} result={resultForView} overrides={applied} />
          ) : style==='csce' ? (
            <ResumeTemplateCSCE user={{ email: (resultForView?.user_email || undefined) }} profile={profile || {}} result={resultForView} overrides={applied} />
          ) : (
            <ResumeTemplateDomain user={{ email: (resultForView?.user_email || undefined) }} profile={profile || {}} result={resultForView} overrides={applied} />
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 rounded border bg-brand-600 text-white hover:bg-brand-700" onClick={downloadPdf}>Download PDF</button>
          <button className="px-3 py-1 rounded border" onClick={async ()=>{
            try {
              const res = await fetch(`${api}/api/resumes/${resumeId}/pdf`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
              if (!res.ok) {
                const err = await res.json().catch(()=>({}));
                return alert(err.error || 'Failed to render PDF');
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `resume_${resumeId}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              alert('Failed to download PDF');
            }
          }}>Download PDF (LaTeX)</button>
        </div>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 rounded border" onClick={async ()=>{
            try {
              const res = await fetch(`${api}/api/resumes/${resumeId}/draft`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(applied) });
              if (!res.ok) { const e=await res.json().catch(()=>({})); alert(e.error||'Save failed'); } else { alert('Draft saved'); }
            } catch { alert('Save failed'); }
          }}>Save Draft</button>
          <button className="px-3 py-1 rounded border" onClick={async ()=>{
            try {
              const res = await fetch(`${api}/api/resumes/${resumeId}/draft`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
              if (!res.ok) { const e=await res.json().catch(()=>({})); alert(e.error||'Reset failed'); } else { setApplied({ extraSkills: [], extraBullets: [], md: null }); }
            } catch { alert('Reset failed'); }
          }}>Reset Draft</button>
        </div>
      </div>

      {result?.recommendations ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Recommended Changes</h2>
          {result.recommendations.summary_suggestion ? (
            <div className="p-3 rounded border bg-gray-50 text-gray-800 mb-2 whitespace-pre-wrap">{result.recommendations.summary_suggestion}</div>
          ) : null}
          {Array.isArray(result.recommendations.skills_to_add) && result.recommendations.skills_to_add.length ? (
            <div className="mb-2">
              <h3 className="font-semibold mb-1">Add to Skills ({result.recommendations.skills_to_add.length})</h3>
              <div className="flex flex-wrap gap-1">
                {result.recommendations.skills_to_add.map((t,i)=>(<span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{t}</span>))}
              </div>
              <div className="mt-2 flex gap-2">
                <button className="px-3 py-1 rounded border" onClick={() => navigator.clipboard?.writeText(result.recommendations.skills_to_add.join(', '))}>Copy Skills</button>
                <button className="px-3 py-1 rounded border" onClick={() => setApplied(prev => ({...prev, extraSkills: Array.from(new Set([...(prev.extraSkills||[]), ...result.recommendations.skills_to_add]))}))}>Apply to Draft</button>
              </div>
            </div>
          ) : null}
          {Array.isArray(result.recommendations.bullet_suggestions) && result.recommendations.bullet_suggestions.length ? (
            <div className="mb-2">
              <h3 className="font-semibold mb-1">Suggested Bullets</h3>
              <ul className="list-disc ml-5 text-sm">
                {result.recommendations.bullet_suggestions.map((b,i)=>(<li key={i}>{b}</li>))}
              </ul>
              <div className="mt-2 flex gap-2">
                <button className="px-3 py-1 rounded border" onClick={() => navigator.clipboard?.writeText(result.recommendations.bullet_suggestions.map(b=>`• ${b}`).join('\n'))}>Copy Bullets</button>
                <button className="px-3 py-1 rounded border" onClick={() => setApplied(prev => ({...prev, extraBullets: Array.from(new Set([...(prev.extraBullets||[]), ...result.recommendations.bullet_suggestions]))}))}>Apply to Draft</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {md ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Draft Markdown</h2>
          <div className="resume-doc bg-white text-black p-6 rounded border shadow-sm">
            <div dangerouslySetInnerHTML={{ __html: mdHtml }} />
          </div>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1 rounded border" onClick={() => navigator.clipboard?.writeText(md)}>Copy Markdown</button>
            <button className="px-3 py-1 rounded border" onClick={downloadMd}>Download .md</button>
          </div>
        </div>
      ) : null}

      {result?.peer_coverage ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Coverage vs Peer Set</h2>
          <div className="text-sm mb-2">Using: {result.peer_coverage.label_file}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Present terms ({result.peer_coverage.present_terms.length})</h3>
              <div className="flex flex-wrap gap-1">
                {result.peer_coverage.present_terms.map((t,i)=>(<span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{t}</span>))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Missing terms ({result.peer_coverage.missing_terms.length})</h3>
              <div className="flex flex-wrap gap-1">
                {result.peer_coverage.missing_terms.map((t,i)=>(<span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{t}</span>))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm">Coverage: {(result.peer_coverage.coverage*100).toFixed(1)}%</div>
        </div>
      ) : null}

      {result?.capstone_coverage ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Coverage vs Capstone CSV (People/Skills/Experience)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Present terms ({result.capstone_coverage.present_terms.length})</h3>
              <div className="flex flex-wrap gap-1">
                {result.capstone_coverage.present_terms.map((t,i)=>(<span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{t}</span>))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Missing terms ({result.capstone_coverage.missing_terms.length})</h3>
              <div className="flex flex-wrap gap-1">
                {result.capstone_coverage.missing_terms.map((t,i)=>(<span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{t}</span>))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm">Coverage: {(result.capstone_coverage.coverage*100).toFixed(1)}%</div>
        </div>
      ) : null}

      {result?.requirements ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Role-weighted Requirements</h2>
          <div className="text-sm mb-2">Family: <strong>{result.requirements.job_family}</strong> · Required min: {result.requirements.required_min} · Present: {result.requirements.present_terms.length}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Critical present ({result.requirements.present_terms.length})</h3>
              <div className="flex flex-wrap gap-1">
                {result.requirements.present_terms.map((t,i)=>(<span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{t}</span>))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Critical missing ({result.requirements.missing_terms.length})</h3>
              <div className="flex flex-wrap gap-1">
                {result.requirements.missing_terms.map((t,i)=>(<span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{t}</span>))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm">Status: {result.requirements.satisfied ? 'Meets minimum' : 'Below minimum'}</div>
        </div>
      ) : null}

      <h2 className="text-lg font-semibold mb-2">Raw JSON</h2>
      <pre className="text-sm overflow-auto p-3 bg-gray-50 dark:bg-gray-900 rounded border">{JSON.stringify(result, null, 2)}</pre>

      <div className="mt-4 flex gap-2">
        <Link className="px-4 py-2 rounded border" to="/optimizer/profile">Back to Profile</Link>
        <Link className="px-4 py-2 rounded border" to="/optimizer">Upload Another</Link>
      </div>
    </div>
  );
}
