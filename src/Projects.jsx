import React from "react";

// Ordered to emphasize strategic platform, operating model, and 0-to-1 product delivery impact
const projects = [
  {
    title: "Engineering Transparency & Delivery Platform (Azure DevOps / Jira Alignment)",
    description:
      "Designed and scaled an Azure DevOps (with complementary Jira alignment) operating model providing end-to-end traceability from multi-quarter roadmaps to task-level execution. Enabled unified taxonomy (portfolio → product → epic → work item) powering real-time velocity, throughput, and SLA dashboards for executive decisioning.",
    tech: ["Azure DevOps", "Jira", "KPI Dashboards", "CI/CD", "Automation"],
  },
  {
    title: "Workflow Engine & Deal Economics in Microsoft Dynamics",
    description:
      "Designed and implemented a workflow engine to digitize deal approval processes previously managed via spreadsheets. Embedded deal economics as approval guardrails, reducing errors and improving decision speed.",
    tech: ["C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "Customer Portal Implementation (Segra360) – 0-to-1 Product Launch",
    description:
      "Directed the end-to-end development of a Java-based customer portal product. Integrated internal billing, ticketing, order, service status, and usage systems; delivered secure auth + MFA; transformed customer self-service engagement.",
    tech: ["Liferay", "Java", "MySQL", "OAuth2", "OIDC", "MFA", "SAML", "MuleSoft", "Linux", "Apache"],
  },
  {
    title: "Liferay to ServiceNow Customer Portal Migration",
    description:
      "Owned delivery of redesigned portal on ServiceNow platform—migrated all capabilities off legacy Liferay while enabling full in-house control of UX and iterative enhancement velocity.",
    tech: ["Java", "JavaScript", "MuleSoft", "ServiceNow Integrations"],
  },
  {
    title: "Microsoft Dynamics On-Premises to Cloud Migration",
    description:
      "Led transition of on‑prem Dynamics footprint to cloud for cost, scalability, and security gains—modernized legacy code, executed secure data migration, integrated Azure services, and adopted Power Apps across business units.",
    tech: ["Azure", "Power Apps", "Functions", "Service Bus", "C#", ".NET", "KingswaySoft", "Azure AD"],
  },
  {
    title: "Salesforce to Microsoft Dynamics Migration",
    description:
      "Directed M&A‑driven CRM consolidation—translated processes, migrated active pipeline data, unified operating cadence, and executed structured change management across commercial teams.",
    tech: ["Tibco Scribe", "C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "SegraMaps – Data Visualization Platform - 0-to-1 Product Launch",
    description:
      "Created ESRI-based application visualizing network infrastructure to accelerate pre-sales qualification; integrated with pricing and quoting workflows—shortened sales cycle and improved targeting decisions.",
    tech: ["ESRI", "JavaScript", "C#", ".NET", "KMZ", "Microsoft Dynamics SDK"],
  },
  {
    title: "Business Proposal Application – 0-to-1 Product Launch",
    description:
      "Delivered C#/.NET proposal generation platform producing branded, board-ready artifacts; streamlined marketing + sales collaboration and reduced manual assembly effort.",
    tech: ["C#", ".NET", "JavaScript", "HTML", "CSS"],
  },
  {
    title: "HubSpot to ServiceNow Integration via MuleSoft",
    description:
      "Built bi-directional HubSpot ↔ ServiceNow integration synchronizing marketing, sales, and service lifecycles; automated lead/case handoffs, improved data fidelity, and reduced manual entry via resilient workflow & error handling design.",
    tech: ["REST APIs", "JSON", "OAuth2", "MuleSoft", "ServiceNow Integrations"],
  },
];

export default function Projects() {
  return (
    <main className="bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Major Projects</h1>
        <p className="mb-8 text-gray-700">
          In addition to the projects below, I have led and contributed to numerous other enterprise initiatives, including post-merger platform consolidations, API integrations, cloud modernization efforts, and cross-functional process automation. These highlights showcase the depth and variety of my leadership across technology domains.
        </p>
        <div className="grid gap-6">
          {projects.map((project, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">{project.title}</h2>
              <p className="text-gray-600 mb-2">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {project.tech.map((t) => (
                  <span key={t} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
