import React from 'react';

export default function Resume() {
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
            Business Technology leader focused on shaping operating models and portfolio governance that translate strategy into consistent delivery and value. Experienced in multi-year roadmap definition, tooling transparency (Jira / Azure DevOps), platform modernization, and application / vendor portfolio simplification to reduce redundancy and unlock capacity. Recognized for executive partnership, talent development, and creating clarity around priorities, sequencing, and measurable progress.
          </p>
        </section>

        {/* Core Competencies & Leadership Skills */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Core Competencies & Leadership Skills</h3>
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
              <p>Jira / Azure DevOps architecture, KPI engineering, executive dashboards (velocity, throughput, SLA), data quality / taxonomy stewardship.</p>
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
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Professional Experience</h3>
          <div className="mb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="font-bold text-gray-800 dark:text-gray-100 tracking-tight">Segra (formerly Spirit Communications & Lumos) — Columbia, SC</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">2012–2025</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Director of Software Development | 2018–2025</div>
            <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3">Application Development Manager / Technical Lead / Analyst | 2012–2018</div>
          </div>
          <ul className="list-disc pl-5 marker:text-gray-400 dark:marker:text-gray-500 space-y-1.5 text-[13px] sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            <li><span className="font-medium">Operating Model:</span> Shifted teams to a product-led structure (pods / value streams) improving focus, accountability, and delivery cadence.</li>
            <li><span className="font-medium">Delivery Transparency:</span> Established unified Jira / Azure DevOps taxonomy and dashboards to provide clear portfolio and execution visibility.</li>
            <li><span className="font-medium">Investment Governance:</span> Introduced lifecycle from business case through benefits review to guide prioritization and reallocation.</li>
            <li><span className="font-medium">Platform Rationalization:</span> Consolidated overlapping platforms (CRM, portal, ServiceNow, cloud) to reduce redundancy and fund modernization.</li>
            <li><span className="font-medium">KPI & Performance:</span> Embedded practical measurement (throughput, cycle time, service levels) into planning and review cadences.</li>
            <li><span className="font-medium">Talent Architecture:</span> Built capability taxonomy and progression model enhancing role clarity and internal advancement.</li>
            <li><span className="font-medium">Strategic Alignment:</span> Partnered with executives and finance to sequence multi-year initiatives and integration work.</li>
            <li><span className="font-medium">Platform Transformations:</span> Led CRM consolidation, cloud migration, and portal modernization to improve scalability and customer experience.</li>
            <li><span className="font-medium">Engineering Enablement:</span> Advanced CI/CD and observability practices accelerating safe, reliable releases.</li>
            <li><span className="font-medium">Identity Modernization:</span> Implemented OAuth2 and MFA to strengthen security and simplify access across platforms.</li>
          </ul>
        </section>

        {/* Education */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Education</h3>
          <div>
            <span className="font-bold text-gray-800 dark:text-gray-100">University of South Carolina — Columbia</span>
            <div className="text-gray-600 dark:text-gray-400 text-sm">B.S. Computer Science (In Progress, Expected May 2026)</div>
            <div className="text-gray-700 dark:text-gray-300 text-sm">Coursework: Data Structures, Windows Programming (in progress), Org Leadership. Completing degree to reinforce long-term exec + technical breadth.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
