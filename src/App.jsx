
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
            Enterprise technology leader with 13+ years’ experience transforming how businesses interact with software by aligning technology strategy with organizational goals, streamlining enterprise platforms, and delivering solutions that drive efficiency, scalability, and exceptional customer experiences. Proven track record in unifying platforms post-merger, defining KPIs and performance frameworks, and leading multi-year roadmaps aligned with growth, M&A integration, and product-led transformation. Skilled in operating model design, investment lifecycle management, and building high-performing distributed teams. Adept at translating strategy into measurable outcomes through delivery transparency, vendor optimization, and enterprise-wide change enablement.


          </p>
        </section>

        {/* Core Competencies */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Core Competencies</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 list-disc list-inside text-gray-700">
            <li><b>Strategic Leadership & Transformation:</b> Enterprise Business Technology Planning, Operating Model Design, Portfolio & Roadmap Execution, M&A Integration, Stakeholder Alignment, Change Enablement</li>
            <li><b>Performance & Delivery Management:</b> KPI Frameworks, Delivery Transparency, Agile at Scale, Cross-Functional Prioritization, Global & Distributed Team Leadership</li>
            <li><b>Platform & Vendor Strategy:</b> CRM Modernization, SaaS Platform Consolidation, Investment Lifecycle Oversight, Vendor Negotiation & Optimization, Business Process Automation</li>
            <li><b>Technical Enablers:</b> Cloud Migration Strategy (AWS, Azure), Identity & Access Management (OAuth2, MFA), API Integration, Observability & Reliability Frameworks</li>
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
              <li>Directed multi-year portfolio execution for enterprise platforms, including CRM consolidation, customer portal launch, and sales tool integration—aligning roadmaps to business growth objectives and M&A outcomes.</li>
              <li>Designed and implemented a performance measurement framework using Azure DevOps to track delivery velocity, throughput, and quality—creating transparency for executive stakeholders and enabling data-driven prioritization.</li>
              <li>Led post-merger operating model adjustments, unifying toolsets and workflows across previously separate organizations to improve scalability, consistency, and speed to market.</li>
              <li>Partnered with executives to prioritize investments, reallocate multimillion-dollar budgets, and sequence initiatives for maximum business impact.</li>
              <li>Managed and developed high-performing engineering teams, ranging from small agile squads to large, multi-disciplinary groups across global locations.</li>
              <li>Owned the investment lifecycle for major platform initiatives from business case development through vendor selection, contract negotiation, and performance tracking.</li>
              <li>Guided migration and consolidation of multiple systems (Salesforce to Microsoft Dynamics, Dynamics on-prem to cloud, internal tools to ServiceNow) to reduce cost, eliminate redundancy, and streamline user experience.</li>
              <li>Oversaw vendor relationships for SaaS platforms, ensuring alignment with capability needs, cost efficiency, and contractual compliance.</li>
              <li>Directed the migration of legacy .NET and Java-based applications to cloud-native architectures (AWS and Azure) to improve scalability, reliability, and deployment speed.</li>
              <li>Introduced CI/CD pipelines and observability frameworks, reducing release cycles and enabling proactive monitoring of production systems.</li>
              <li>Led identity modernization for customer-facing systems, implementing OAuth2, role-based access, and MFA to improve security and streamline authentication across platforms.</li>
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
    </Router>
  );
}

export default App;
