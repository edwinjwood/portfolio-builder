
import './App.css';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Projects from './Projects';


function Resume() {
  return (
    <main className="bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Edwin J. Wood</h1>
          <h2 className="text-lg sm:text-xl text-gray-600 font-medium mb-2">Business Technology Transformation | Strategic Portfolio Leadership | Enterprise Platform Integration</h2>
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
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Professional Summary</h3>
          <p className="text-gray-700 leading-relaxed">
            Enterprise Business Technology leader driving product-led, automation-first operating model transformation for growth and M&A-driven organizations. Architect of multi-year BT strategy, operating model design (pods / value streams / global sourcing), and portfolio governance linking investment lifecycle (business case → execution → renewal) to measurable value realization. Built metrics-driven culture—velocity, throughput, cost efficiency, SLA adherence—through Jira / Azure DevOps transparency and KPI frameworks. Led platform & vendor rationalization (CRM, customer portals, ServiceNow, cloud modernization) to accelerate scale and reduce redundancy. Recognized for executive alignment, talent strategy development, and converting strategic roadmaps into accountable, data-informed outcomes.
          </p>
        </section>

        {/* Core Competencies */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Core Competencies</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 list-disc list-inside text-gray-700 text-sm">
            <li><b>BT Strategy & Operating Model:</b> Product-Led, Automation-First Transformation, Pods / Value Streams, Global Sourcing, Multi-Year Roadmaps</li>
            <li><b>Portfolio & Investment Governance:</b> Value Themes, Business Case → Renewal, Prioritization, Roadmap to Execution Traceability</li>
            <li><b>Transparency & Tooling:</b> Jira / Azure DevOps Architecture, KPI Frameworks, Delivery & SLA Dashboards</li>
            <li><b>Metrics & Performance:</b> Velocity, Throughput, Cost Efficiency, Cycle Time, SLA Compliance</li>
            <li><b>Platform & Vendor Strategy:</b> Rationalization (CRM, Portal, ServiceNow, Cloud), Contract & Renewal Optimization, Identity & Access Modernization (OAuth2, MFA)</li>
            <li><b>Talent & Enablement:</b> Capability Development, Skill Taxonomy, Coaching, High-Performance Culture</li>
          </ul>
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
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Directed product-led, automation-first BT operating model shift (pods / value streams) aligning multi-year strategy & M&A integration to measurable value themes.</li>
              <li>Built integrated Jira / Azure DevOps hierarchy for roadmap → epic → story → task traceability; enabled real-time velocity, throughput & SLA dashboards.</li>
              <li>Established investment governance lifecycle (business case → execution → benefits tracking → renewal) tying spend to value realization & budget reallocation.</li>
              <li>Led platform & vendor rationalization (CRM, customer portal, ServiceNow, cloud) reducing redundancy and funding higher-value capability expansion.</li>
              <li>Designed performance & KPI framework (velocity, cycle time, cost per feature, SLA compliance) embedded in executive reporting & prioritization cadence.</li>
              <li>Developed BT talent strategy—capability taxonomy, skill gap analysis, progression frameworks—improving role clarity & succession readiness.</li>
              <li>Partnered with executives and finance to sequence investments, reallocate multimillion-dollar budgets, and optimize portfolio value realization.</li>
              <li>Delivered customer-facing and internal platform transformations (Salesforce to Dynamics, Dynamics on‑prem to cloud, portal modernization) improving scalability & experience.</li>
              <li>Introduced CI/CD and observability practices accelerating release cycles and proactive incident management.</li>
              <li>Modernized identity & access (OAuth2, MFA) strengthening security posture and unifying authentication across platforms.</li>
            </ul>
          </div>
        </section>

        {/* Education */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Education</h3>
          <div>
            <span className="font-bold text-gray-800">University of South Carolina — Columbia</span>
            <div className="text-gray-600 text-sm">Bachelor of Science in Computer Science (In Progress, Expected May 2026)</div>
            <div className="text-gray-700 text-sm">Currently completing degree to support long-term leadership and technical growth.</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function App() {
  return (
    <Router>
      <nav className="bg-white border-b shadow-sm py-4 mb-8">
        <div className="max-w-3xl mx-auto flex gap-6 px-4">
          <Link to="/" className="text-gray-700 font-semibold hover:text-blue-600 transition">Resume</Link>
          <Link to="/projects" className="text-gray-700 font-semibold hover:text-blue-600 transition">Projects</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Resume />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
  <footer className="text-center text-xs text-gray-400 pb-6">Build test footer</footer>
    </Router>
  );
}

export default App;
