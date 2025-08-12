import React from "react";

const projects = [
  {
    title: "Customer Portal Implementation (Segra360) – 0-to-1 Product Launch",
    description: "Directed the end-to-end development of a Java-based customer portal, transforming how clients access account information. Designed as a standalone product with integrations to internal billing, ticketing, orders, service status, and usage metrics systems. Delivered secure authentication and multi-factor capabilities.",
    tech: ["Liferay", "Java", "MySQL", "OAuth2", "OIDC", "MFA", "SAML", "MuleSoft", "Linux", "Apache"],
  },
  {
    title: "SegraMaps – 0-to-1 Data Visualization Platform",
    description: "Led creation of an ESRI-based web application that visualized network infrastructure data, enabling sales teams to make faster, better-informed decisions. Integrated with pre-sales tools to streamline actions and accelerate the sales cycle.",
    tech: ["ESRI", "JavaScript", "C#", ".NET", "KMZ", "Microsoft Dynamics SDK"],
  },
  {
    title: "Business Proposal Application – 0-to-1 Product Launch",
    description: "Oversaw full lifecycle of a C#/.NET application allowing sales teams to create branded, board-ready proposals. Collaborated closely with marketing and sales to deliver a polished, user-friendly interface.",
    tech: ["C#", ".NET", "JavaScript", "HTML", "CSS"],
  },
  {
    title: "Salesforce to Microsoft Dynamics Migration",
    description: "Led migration project driven by M&A activity, translating company processes into Dynamics and managing the complete data migration of active deals. Directed change management across affected teams.",
    tech: ["Tibco Scribe", "C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "Workflow Engine & Deal Economics in Microsoft Dynamics",
    description: "Designed and implemented a workflow engine to digitize deal approval processes previously managed via spreadsheets. Integrated deal economics as approval metrics, reducing errors and improving decision speed.",
    tech: ["C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "Microsoft Dynamics On-Premises to Cloud Migration",
    description: "Managed the full transition to cloud for cost reduction, scalability, security, and efficiency. Included modernization of legacy code, secure data migration, Azure integration, and adoption of Power Apps. Led change management across multiple departments.",
    tech: ["Azure Power Apps (Functions, Service Bus)", "C#", ".NET", "KingswaySoft", "Azure AD"],
  },
  {
    title: "Liferay to ServiceNow Customer Portal Migration",
    description: "Oversaw vendor and internal team delivery of a redesigned customer portal within ServiceNow, enabling full in-house control over design and functionality. Migrated all capabilities from the legacy Liferay platform.",
    tech: ["Java", "JavaScript", "MuleSoft", "ServiceNow Integrations"],
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
