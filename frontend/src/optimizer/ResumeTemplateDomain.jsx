import React from 'react';

export default function ResumeTemplateDomain({ user, profile, result, overrides }) {
  const generated = result?.generated?.structure;
  const name = (generated?.name || user?.name || user?.email?.split('@')[0] || 'Candidate').replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const title = generated?.headline || profile?.target_title || 'Professional Candidate';
  const domain = generated?.domain || result?.domain || 'general';
  const baseHighlights = generated?.highlights?.length ? generated.highlights : (result?.recommendations?.bullet_suggestions || []);
  const bullets = Array.from(new Set([...(baseHighlights || []), ...(overrides?.extraBullets || [])])).slice(0,8);
  const baseSkills = generated?.skillGroups?.length ? generated.skillGroups.flatMap(group => group.items || []) : (result?.recommendations?.skills_to_add || []);
  const clean = (s) => String(s||'').toLowerCase().replace(/[^a-z0-9+.#/ ]/g,' ').replace(/\s+/g,' ').trim();
  const presentSkills = Array.from(new Set([
    ...((result?.peer_coverage?.present_terms||[]).map(clean)),
    ...((result?.capstone_coverage?.present_terms||[]).map(clean)),
  ].filter(Boolean))).slice(0,30);
  const recSkills = Array.from(new Set([...(baseSkills||[]).map(clean), ...(overrides?.extraSkills||[]).map(clean)])).filter(Boolean);
  const skills = presentSkills.length ? presentSkills : recSkills;
  const certChips = Array.isArray(generated?.certifications) && generated.certifications.length ? generated.certifications : (Array.isArray(profile?.certs_json) ? profile.certs_json : []);
  const contact = generated?.contact || {};
  const contactItems = Array.from(new Set([
    contact.location,
    contact.phone,
    contact.email || user?.email,
    contact.linkedin,
    contact.github,
    contact.website,
  ].filter(Boolean)));
  const summaryLine = (() => {
    if (domain !== 'nursing') return null;
    const emr = skills.find(s=>/epic|emr|ehr/.test(s));
    const unit = skills.find(s=>/(icu|er|clinic|hospital|unit|ward)/.test(s));
    const parts = [];
    if (unit) parts.push(`Rotations: ${unit}`);
    if (emr) parts.push(`EMR: ${emr.toUpperCase()}`);
    if (certChips && certChips.length) parts.push(`Certs: ${certChips.join(', ')}`);
    return parts.length ? parts.join(' • ') : null;
  })();

  const Section = ({label, children}) => (
    <section className="mb-3">
      <h2 className="text-lg font-semibold">{label}</h2>
      <div className="text-sm">{children}</div>
    </section>
  );

  const domainSections = () => {
    switch (domain) {
      case 'nursing':
        return (
          <>
            <Section label="Licensure & Certifications">
              {/* Merge from Profile certs if any */}
<div className="flex flex-wrap gap-1">{certChips.map((c,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{c}</span>))}</div>
            </Section>
            <Section label="Clinical Experience">
              <div className="text-xs text-gray-600">Add rotations, units, and EMR/equipment here.</div>
            </Section>
          </>
        );
      case 'business':
        return (
          <>
            <Section label="Certifications">
              <div className="flex flex-wrap gap-1">{(profile?.certs_json||[]).map((c,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{c}</span>))}</div>
            </Section>
            <Section label="Impact Highlights">
              <ul className="list-disc ml-5 text-sm">{bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
            </Section>
          </>
        );
      case 'civil':
        return (
          <>
            <Section label="Licensure">
              <div className="text-xs text-gray-600">PE/EIT and relevant jurisdiction.</div>
            </Section>
            <Section label="Project Portfolio">
              <ul className="list-disc ml-5 text-sm">{bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
            </Section>
          </>
        );
      case 'engineering':
      case 'csce':
        return (
          <>
            <Section label="Technical Focus">
              <ul className="list-disc ml-5 text-sm">{bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
            </Section>
          </>
        );
      case 'mechanical':
        return (
          <>
            <Section label="Mechanical Focus">
              <ul className="list-disc ml-5 text-sm">{bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
            </Section>
          </>
        );
      case 'electrical':
        return (
          <>
            <Section label="Electrical Focus">
              <ul className="list-disc ml-5 text-sm">{bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
            </Section>
          </>
        );
      case 'chef':
        return (
          <>
            <Section label="Certifications">
              <div className="flex flex-wrap gap-1">{(profile?.certs_json||[]).map((c,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{c}</span>))}</div>
            </Section>
            <Section label="Culinary Skills">
              <div className="text-xs text-gray-600">Cuisines, methods, menu development, plating, costing.</div>
            </Section>
            <Section label="Kitchen Operations">
              <div className="text-xs text-gray-600">Line management, prep, inventory, sanitation, service.</div>
            </Section>
          </>
        );
      case 'hr':
        return (
          <>
            <Section label="Certifications">
              <div className="flex flex-wrap gap-1">{(profile?.certs_json||[]).map((c,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{c}</span>))}</div>
            </Section>
            <Section label="Core HR Disciplines">
              <div className="text-xs text-gray-600">Recruiting, onboarding, compliance, benefits, payroll.</div>
            </Section>
          </>
        );
      case 'banking':
        return (
          <>
            <Section label="Licenses & Certifications">
              <div className="flex flex-wrap gap-1">{(profile?.certs_json||[]).map((c,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{c}</span>))}</div>
            </Section>
            <Section label="Products & Services">
              <div className="text-xs text-gray-600">Retail/commercial banking, lending, underwriting, KYC/AML.</div>
            </Section>
          </>
        );
      case 'aviation':
        return (
          <>
            <Section label="Licenses & Certifications">
              <div className="text-xs text-gray-600">Pilot/airframe/avionics; list ratings, hours, jurisdictions.</div>
            </Section>
            <Section label="Flight / Technical Experience">
              <ul className="list-disc ml-5 text-sm">{bullets.map((b,i)=>(<li key={i}>{b}</li>))}</ul>
            </Section>
          </>
        );
      case 'accounting':
        return (
          <>
            <Section label="Licensure & Certifications">
              <div className="flex flex-wrap gap-1">{(profile?.certs_json||[]).map((c,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{c}</span>))}</div>
            </Section>
            <Section label="Core Competencies">
              <div className="text-xs text-gray-600">Audit, tax, reporting, GAAP/IFRS, reconciliations.</div>
            </Section>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="resume-doc">
      <header className="pb-2 mb-3 border-b">
        <h1 className="text-3xl font-extrabold leading-tight">{name}</h1>
        <div className="text-sm text-gray-700">
          {title}{profile?.target_industry && !title?.includes(profile.target_industry) ? ` — ${profile.target_industry}` : ''}
        </div>
        {contactItems.length ? (
          <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
            {contactItems.map((item, i) => <span key={i}>{item}</span>)}
          </div>
        ) : null}
        {summaryLine ? (<div className="text-xs text-gray-600 mt-1">{summaryLine}</div>) : null}
      </header>

      {domainSections()}

      {skills.length ? (
        <Section label="Skills">
          <div className="flex flex-wrap gap-1">{skills.map((s,i)=>(<span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{s}</span>))}</div>
        </Section>
      ) : null}
    </div>
  );
}
