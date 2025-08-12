
import './App.css';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import React, { useState, useEffect, Suspense } from 'react';
const Projects = React.lazy(() => import('./Projects'));


function Resume() {
  return (
    <main id="content" className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Edwin J. Wood</h1>
          <h2 className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium mb-2">Product-Led Business Technology & Platform Transformation Leader</h2>
          <div className="flex flex-col sm:flex-row sm:items-center text-gray-500 text-sm gap-1">
            <span>Columbia, SC</span>
            <span className="hidden sm:inline mx-2">•</span>
            <span>803.979.2778</span>
            <span className="hidden sm:inline mx-2">•</span>
            <a href="mailto:edwinjwood@gmail.com" className="hover:underline">edwinjwood@gmail.com</a>
            <span className="hidden sm:inline mx-2">•</span>
            <a href="https://linkedin.com/in/edwin-j-wood" target="_blank" rel="noopener noreferrer" className="hover:underline">linkedin.com/in/edwin-j-wood</a>
          </div>
        </header>

        {/* Professional Summary */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Professional Summary</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
            Business Technology leader transforming operating models (pods / value streams) and portfolio governance to convert strategy into measurable outcomes—cycle time ↓28%, platform redundancy spend ↓$3.2M, release cadence ↑4x. Architected multi-year roadmaps, tooling transparency (Jira / Azure DevOps), KPI frameworks (velocity, throughput, SLA), and vendor rationalization across CRM, portal, ServiceNow, and cloud modernization to fund innovation. Known for executive partnership, talent development, and data-backed decision enablement.
          </p>
        </section>

        {/* Core Competencies */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Core Competencies</h3>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Strategy & Operating Model</p>
              <p>Product-led & automation-first transformation; pods / value streams; global sourcing optimization; multi-year roadmap architecture.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Portfolio & Investment Governance</p>
              <p>Value theme definition, business case → benefits realization lifecycle, prioritization frameworks, traceability (roadmap → epic → work item).</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Transparency, Data & Tooling</p>
              <p>Jira / Azure DevOps architecture, KPI engineering, exec dashboards (velocity, throughput, SLA), data quality / taxonomy stewardship.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Platform & Vendor Strategy</p>
              <p>Rationalization (CRM, portal, ServiceNow, cloud), contract & renewal optimization, identity & access modernization (OAuth2, MFA).</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Metrics & Performance</p>
              <p>Cycle time, velocity, cost per feature, SLA adherence; continuous improvement cadences & benchmarking.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Talent & Enablement</p>
              <p>Capability taxonomy, skill gap analysis, coaching frameworks, succession readiness, high-performance culture design.</p>
            </div>
          </div>
        </section>

        {/* Professional Experience */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Professional Experience</h3>
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <span className="font-bold text-gray-800">Segra (formerly Spirit Communications & Lumos) — Columbia, SC</span>
              <span className="text-gray-500 text-sm">2012–2025</span>
            </div>
            <div className="text-gray-600 text-sm mb-1">Director of Software Development | 2018–2025</div>
            <div className="text-gray-600 text-sm mb-2">Application Development Manager / Technical Lead / Analyst | 2012–2018</div>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-sm">
              <li>Shifted organization to product-led, automation-first operating model (pods / value streams) → feature cycle time ↓28% & release cadence ↑4x.</li>
              <li>Implemented unified Jira / Azure DevOps taxonomy & dashboards → real-time portfolio health; leadership decision latency ↓~35%.</li>
              <li>Established investment governance (business case → benefits realization → renewal) reallocating ~15% run spend to growth initiatives.</li>
              <li>Rationalized overlapping platforms (CRM, portal, ServiceNow, cloud) cutting redundancy spend ~$3.2M and funding modernization backlog.</li>
              <li>Engineered KPI framework (velocity, cost / feature, SLA, cycle time) embedded in quarterly planning & performance reviews.</li>
              <li>Built capability taxonomy & progression model → reduced role ambiguity and increased internal fill rate for senior roles (succession depth ↑2x).</li>
              <li>Partnered with Finance & ELT to prioritize multi-year investment themes & sequencing across M&A integration waves.</li>
              <li>Delivered major platform transformations (Salesforce → Dynamics, on‑prem → cloud, portal modernization) improving scalability & CX.</li>
              <li>Introduced CI/CD & observability (tracing, structured logging) → deployment lead time ↓70% & MTTR improvement.</li>
              <li>Modernized identity & access (OAuth2, MFA) strengthening security posture & unifying auth pathways across products.</li>
            </ul>
          </div>
        </section>

        {/* Education */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Education</h3>
          <div>
            <span className="font-bold text-gray-800 dark:text-gray-100">University of South Carolina — Columbia</span>
            <div className="text-gray-600 dark:text-gray-400 text-sm">B.S. Computer Science (In Progress, Expected May 2026)</div>
            <div className="text-gray-700 dark:text-gray-300 text-sm">Coursework: Data Structures, Distributed Systems (in progress), Org Leadership. Completing degree to reinforce long-term exec + technical breadth.</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('dark') === 'true'; } catch(e) { return false; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [dark]);

  return (
    <Router>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-600 text-white px-3 py-2 rounded">Skip to content</a>
      <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm py-4 mb-8">
        <div className="max-w-3xl mx-auto flex gap-6 px-4 items-center">
          <div className="flex gap-4">
            <NavLink to="/" end className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Resume</NavLink>
            <NavLink to="/projects" className={({isActive}) => `font-semibold transition ${isActive ? 'text-brand-600 dark:text-brand-500' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`} aria-current={({isActive}) => isActive ? 'page' : undefined}>Projects</NavLink>
          </div>
          <button onClick={() => setDark(d => { const nv = !d; try { localStorage.setItem('dark', nv.toString()); } catch(e){} return nv; })} className="ml-auto text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" aria-pressed={dark} aria-label="Toggle dark mode">{dark ? 'Light' : 'Dark'}</button>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Resume />} />
        <Route path="/projects" element={<Suspense fallback={<div className='px-4'>Loading…</div>}><Projects /></Suspense>} />
      </Routes>
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 pb-6">© {new Date().getFullYear()} Edwin J. Wood</footer>
    </Router>
  );
}

export default App;
