import React from "react";

// Ordered to emphasize strategic platform, operating model, and 0-to-1 product delivery impact
const projects = [
  {
    title: "Engineering Transparency & Delivery Platform (Azure DevOps / Jira Alignment)",
    category: "Operating Model",
    description:
      "Designed and scaled operating model and unified taxonomy (portfolio to work item) enabling traceability and informed decision-making.",
    tech: ["Azure DevOps", "Jira", "KPI Dashboards", "CI/CD", "Automation"],
  },
  {
    title: "Workflow Engine & Deal Economics in Microsoft Dynamics",
    category: "Process Automation",
    description:
      "Designed and implemented a workflow engine to digitize deal approval processes previously managed via spreadsheets. Embedded deal economics as approval guardrails, reducing errors and improving decision speed.",
    tech: ["C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "Customer Portal (Segra360) – 0-to-1 Launch",
    category: "Product",
    description:
      "Directed the end-to-end development of a Java-based customer portal product. Integrated internal billing, ticketing, order, service status, and usage systems; delivered secure auth + MFA; transformed customer self-service engagement.",
    tech: ["Liferay", "Java", "MySQL", "OAuth2", "OIDC", "MFA", "SAML", "MuleSoft", "Linux", "Apache"],
  },
  {
    title: "Liferay to ServiceNow Customer Portal Migration",
    category: "Migration",
    description:
      "Owned delivery of redesigned portal on ServiceNow platform—migrated all capabilities off legacy Liferay while enabling full in-house control of UX and iterative enhancement velocity.",
    tech: ["Java", "JavaScript", "MuleSoft", "ServiceNow Integrations"],
  },
  {
    title: "Microsoft Dynamics On-Premises to Cloud Migration",
    category: "Cloud Modernization",
    description:
      "Led transition of on‑prem Dynamics footprint to cloud for cost, scalability, and security gains—modernized legacy code, executed secure data migration, integrated Azure services, and adopted Power Apps across business units.",
    tech: ["Azure", "Power Apps", "Functions", "Service Bus", "C#", ".NET", "KingswaySoft", "Azure AD"],
  },
  {
    title: "Salesforce to Microsoft Dynamics Migration",
    category: "M&A Integration",
    description:
      "Directed M&A‑driven CRM consolidation—translated processes, migrated active pipeline data, unified operating cadence, and executed structured change management across commercial teams.",
    tech: ["Tibco Scribe", "C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "SegraMaps – Data Visualization Platform (0-to-1)",
    category: "Product",
    description:
      "Created ESRI-based application visualizing network infrastructure to accelerate pre-sales qualification; integrated with pricing and quoting workflows—shortened sales cycle and improved targeting decisions.",
    tech: ["ESRI", "JavaScript", "C#", ".NET", "KMZ", "Microsoft Dynamics SDK"],
  },
  {
    title: "Business Proposal Application (0-to-1)",
    category: "Product",
    description:
      "Delivered C#/.NET proposal generation platform producing branded, board-ready artifacts; streamlined marketing + sales collaboration and reduced manual assembly effort.",
    tech: ["C#", ".NET", "JavaScript", "HTML", "CSS"],
  },
  {
    title: "HubSpot to ServiceNow Integration via MuleSoft",
    category: "Integration",
    description:
      "Built bi-directional HubSpot ↔ ServiceNow integration synchronizing marketing, sales, and service lifecycles; automated lead/case handoffs, improved data fidelity, and reduced manual entry via resilient workflow & error handling design.",
    tech: ["REST APIs", "JSON", "OAuth2", "MuleSoft", "ServiceNow Integrations"],
  },
];

export default function Projects() {
  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Major Projects</h1>
        <p className="mb-8 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
          In addition to the projects below, I have led and contributed to other enterprise initiatives including platform consolidation, integration patterns, modernization, and cross-functional process improvement. These selected efforts reflect breadth across operating model, product delivery, migration, and integration domains.
        </p>
        <div className="grid gap-6">
          {projects.map((project, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">{project.title}</h2>
                {project.category && <span className="text-[10px] uppercase tracking-wide bg-brand-600 text-white px-2 py-0.5 rounded">{project.category}</span>}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">{project.description}</p>
              {/* Impact line removed to simplify presentation */}
              <div className="flex flex-wrap gap-2 mb-1">
                {project.tech.map((t) => (
                  <span key={t} className="bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 border border-blue-600/20 dark:border-blue-400/20 text-[10px] px-2 py-1 rounded">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
