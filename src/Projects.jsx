import React, { useState, useEffect } from "react";

// Refactored with impact-first descriptions, normalized taxonomy, weights, impact field
// Normalized taxonomy (conceptual + thematic): Operating Model, Modernization, Product, Automation, Integration, Analytics, M&A Integration, Leadership, Strategy
const projects = [
  {
    title: "Engineering Transparency & Delivery Platform (Azure DevOps / Jira Alignment)",
    categories: ["Operating Model", "Analytics"],
    impact: "Taxonomy alignment & delivery visibility",
    weight: 100,
    description:
      "Established unified engineering taxonomy and delivery visibility across Azure DevOps & Jira—improved traceability from portfolio themes to work items and informed investment decisions.",
    tech: ["Azure DevOps", "Jira", "KPI Dashboards", "CI/CD", "Automation"],
  },
  {
    title: "Lead to Logo Revenue Process Orchestration",
    categories: ["Operating Model", "Automation"],
    impact: "Lifecycle standardization & conversion insight",
    weight: 95,
    description:
      "Standardized end‑to‑end Lead → Opportunity → Quote lifecycle in Dynamics—embedded staged business logic, clarified marketing→sales handoffs, and surfaced pipeline conversion insights via dashboards.",
    tech: ["Microsoft Dynamics", "Power BI", "Business Rules", "Workflows", "C#", ".NET", "REST APIs"],
  },
  {
    title: "Sales Platform Integration (Post-M&A) into ServiceNow SOM",
    categories: ["M&A Integration", "Operating Model", "Integration"],
    impact: "Post‑M&A sales platform unification",
    weight: 92,
    description:
      "Unified three disparate sales systems post‑M&A into single SOM platform—migrated logic, data models, and processes to standardize quoting, order capture, and lifecycle governance.",
    tech: ["ServiceNow SOM", "Microsoft Dynamics", "Data Migration", "Process Mapping", "Integration", "MuleSoft", "Governance"],
  },
  {
    title: "Workflow Engine & Deal Economics in Microsoft Dynamics",
    categories: ["Automation", "Operating Model"],
    impact: "Approval digitization & economic guardrails",
    weight: 88,
    description:
      "Digitized manual deal approvals—central workflow engine with embedded economics guardrails reduced policy drift and approval cycle time.",
    tech: ["C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "Contract Creation & Document Warehouse Integration",
    categories: ["Automation", "Integration"],
  impact: "Contract generation speed & accuracy",
    weight: 86,
    description:
      "Delivered template‑driven contract platform enabling faster, error‑reduced generation—automated assembly, SharePoint storage, and Dynamics linkage for lifecycle access.",
    tech: ["Microsoft Dynamics", "SharePoint", "REST APIs", "Word Templates", "C#", ".NET"],
  },
  {
    title: "E-Signature Integration within Dynamics Workflow",
    categories: ["Automation", "Integration"],
  impact: "Faster contract execution & tracking",
    weight: 84,
    description:
      "Embedded e‑signature orchestration—automated envelope assembly, routing, status tracking, and archival with bidirectional system links accelerating contract execution.",
    tech: ["Microsoft Dynamics", "e-Signature APIs", "REST APIs", "Templates", "C#", ".NET", "Webhooks"],
  },
  {
    title: "Customer Portal (Segra360) – 0-to-1 Launch",
    categories: ["Product", "Integration"],
    impact: "Unified customer self‑service",
    weight: 83,
    description:
  "Launched self-service portal consolidating billing, ticketing, orders, service status, and usage—secured with MFA/OIDC to improve engagement efficiency.",
    tech: ["Liferay", "Java", "MySQL", "OAuth2", "OIDC", "MFA", "SAML", "MuleSoft", "Linux", "Apache"],
  },
  {
    title: "Liferay to ServiceNow Customer Portal Migration",
  categories: ["Migration & Modernization", "Product", "Integration"],
    impact: "Portal replatform & in‑house agility",
    weight: 82,
    description:
      "Replatformed legacy portal to ServiceNow—eliminated external vendor dependency and enabled iterative in‑house UX & capability evolution.",
    tech: ["Java", "JavaScript", "MuleSoft", "ServiceNow Integrations"],
  },
  {
    title: "Microsoft Dynamics On-Premises to Cloud Migration",
  categories: ["Migration & Modernization", "Operating Model"],
    impact: "Modernized scalable CRM platform",
    weight: 81,
    description:
      "Modernized Dynamics footprint—migrated to Azure for scalability/security, refactored legacy code, integrated serverless services, and enabled Power Apps adoption.",
    tech: ["Azure", "Power Apps", "Functions", "Service Bus", "C#", ".NET", "KingswaySoft", "Azure AD"],
  },
  {
    title: "Salesforce to Microsoft Dynamics Migration",
  categories: ["M&A Integration", "Migration & Modernization", "Operating Model", "Integration"],
    impact: "Post‑M&A CRM consolidation",
    weight: 80,
    description:
      "Consolidated CRM platforms post‑M&A—translated divergent processes, migrated active pipeline data, and unified commercial operating cadence with structured change management.",
    tech: ["Tibco Scribe", "C#", ".NET", "Microsoft Dynamics SDK"],
  },
  {
    title: "SegraMaps – Data Visualization Platform (0-to-1)",
    categories: ["Product", "Analytics", "Integration"],
    impact: "Faster pre‑sales qualification",
    weight: 78,
    description:
      "Delivered geospatial network visualization platform—accelerated pre‑sales qualification and improved pricing & targeting decisions via integrated workflows.",
    tech: ["ESRI", "JavaScript", "C#", ".NET", "KMZ", "Microsoft Dynamics SDK"],
  },
  {
    title: "Location Validation & Address Standardization Platform",
    categories: ["Integration", "Automation"],
    impact: "Address quality & deduplication",
    weight: 77,
    description:
  "Delivered location validation service integrating Dynamics, ESRI, and later MuleSoft/ServiceNow—improved address quality, eliminated duplicates, and enabled non-USPS site models.",
    tech: ["Microsoft Dynamics", "ESRI", "ServiceNow", "MuleSoft", "API Gateway", "C#", ".NET", "REST APIs"],
  },
  {
    title: "Business Proposal Application (0-to-1)",
    categories: ["Product", "Automation"],
  impact: "Proposal generation speed & consistency",
    weight: 75,
    description:
      "Streamlined proposal generation—automated branded document assembly reducing manual marketing–sales coordination effort.",
    tech: ["C#", ".NET", "JavaScript", "HTML", "CSS"],
  },
  {
    title: "HubSpot to ServiceNow Integration via MuleSoft",
    categories: ["Integration", "Automation"],
    impact: "Lifecycle continuity & reduced manual entry",
    weight: 74,
    description:
      "Delivered integration of marketing and sales objects with resilient error handling—improved lifecycle continuity and reduced manual data entry.",
    tech: ["REST APIs", "JSON", "OAuth2", "MuleSoft", "ServiceNow Integrations"],
  },
  {
    title: "Additional Strategic Initiatives",
    categories: ["Leadership", "Strategy"],
    impact: "Broader transformation leadership",
  weight: 76, // Positioned above lowest-weight individual project so page ends on a specific deliverable
    description:
      "Led platform rationalization, vendor portfolio optimization, KPI framework design, and enterprise operating model shifts aligning technology delivery with business priorities. Managed multi-year roadmaps, multimillion-dollar budgets, and cross-functional alignment across technology domains.",
    tech: [],
  },
];

export default function Projects() {
  // Category derivation with defined ordering and counts
  const CATEGORY_ORDER = [
    "Operating Model",
    "M&A Integration",
    "Product",
    "Automation",
    "Integration",
    "Migration & Modernization",
    "Analytics",
    "Leadership",
    "Strategy",
  ];
  const [activeCategory, setActiveCategory] = useState("All");

  const counts = React.useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      p.categories.forEach((c) => (map[c] = (map[c] || 0) + 1));
    });
    return map;
  }, []);

  const categories = React.useMemo(
    () => ["All", ...CATEGORY_ORDER.filter((c) => counts[c])],
    [counts]
  );

  // URL hash sync supporting HashRouter (#/path?cat=Category) and legacy (#cat=Category)
  useEffect(() => {
    const hash = window.location.hash; // e.g., #/projects?cat=Automation or #cat=Automation
    if (!hash) return;
    if (hash.startsWith('#cat=')) {
      const raw = decodeURIComponent(hash.substring(5));
      if (raw && raw !== 'All') setActiveCategory(raw);
      return;
    }
    // HashRouter style: #/projects?cat=Automation
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const query = hash.substring(qIndex + 1); // cat=Automation
      const params = new URLSearchParams(query);
      const cat = params.get('cat');
      if (cat && cat !== 'All') setActiveCategory(decodeURIComponent(cat));
    }
  }, []);

  useEffect(() => {
    const current = window.location.hash; // preserve route segment if present
    const qIndex = current.indexOf('?');
    const routePart = current.startsWith('#/') ? (qIndex === -1 ? current : current.substring(0, qIndex)) : '';
    if (activeCategory === 'All') {
      // Remove cat param while preserving route
      if (routePart) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + routePart);
      } else if (current.startsWith('#cat=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + '#');
      }
    } else {
      const catFrag = `cat=${encodeURIComponent(activeCategory)}`;
      if (routePart) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + `${routePart}?${catFrag}`);
      } else {
        window.location.hash = catFrag; // legacy fallback
      }
    }
  }, [activeCategory]);

  const filtered = React.useMemo(() => {
    const base = activeCategory === "All" ? projects : projects.filter((p) => p.categories.includes(activeCategory));
    return [...base].sort((a, b) => b.weight - a.weight);
  }, [activeCategory]);

  return (
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Major Projects</h1>
        <p className="mb-8 text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
          In addition to the projects below, I have led and contributed to other enterprise initiatives including platform consolidation, integration patterns, modernization, and cross-functional process improvement. These selected efforts reflect breadth across operating model, product delivery, migration, and integration domains.
        </p>
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
    {categories.map((cat) => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={active}
                  className={
                    `text-xs tracking-wide px-3 py-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 ` +
                    (active
                      ? "bg-brand-600 text-white border-brand-600 dark:border-brand-500 shadow"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700")
                  }
                >
      {cat}{cat !== "All" && counts[cat] ? ` (${counts[cat]})` : cat === "All" ? ` (${projects.length})` : ""}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-6">
          {filtered.map((project, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">{project.title}</h2>
                <div className="flex flex-wrap gap-1">
                  {project.categories.map((cat) => (
                    <span key={cat} className="text-[10px] uppercase tracking-wide bg-brand-600 text-white px-2 py-0.5 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              {project.impact && (
                <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400 mb-1 tracking-wide">{project.impact}</p>
              )}
              <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm leading-relaxed">{project.description}</p>
              {/* Impact line removed to simplify presentation */}
              <div className="flex flex-wrap gap-2 mb-1">
                {project.tech.length > 0 && project.tech.map((t) => (
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
