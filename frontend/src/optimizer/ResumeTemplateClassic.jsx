import React, { useMemo } from 'react';

function splitLines(text) {
  return (text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function parseSections(text) {
  const lines = splitLines(text);
  const sections = {};
  let current = 'summary';
  sections[current] = [];
  for (const line of lines) {
    const low = line.toLowerCase();
    if (/^education\b/i.test(line)) { current = 'education'; sections[current] = []; continue; }
    if (/^experience\b/i.test(line)) { current = 'experience'; sections[current] = []; continue; }
    if (/^technical projects?/i.test(line)) { current = 'projects'; sections[current] = []; continue; }
    if (/^technical skills?/i.test(line)) { current = 'skills'; sections[current] = []; continue; }
    if (/^leadership|achievements|awards/i.test(line)) { current = 'achievements'; sections[current] = []; continue; }
    sections[current].push(line);
  }
  return sections;
}

const CATS = {
  Languages: ['c++','c','python','javascript','typescript','java','bash','matlab','sql'],
  Frameworks: ['react','node','express','arduinojson','gtest','google test','u8g2'],
  Embedded: ['esp32','stm32','arduino','i2c','spi','uart','rtos','hal','can'],
  Tools: ['git','docker','nvm','zsh','ltspice','fusion 360','bambu studio','weasyprint'],
  Cloud: ['aws','gcp','azure','vercel','railway','github actions'],
};

function categorizeSkills(keywords, skillsText) {
  const all = new Set();
  (keywords || []).forEach(s => all.add(String(s).toLowerCase()));
  splitLines(skillsText).forEach(s => s.split(/[,|•]/).forEach(x => all.add(x.trim().toLowerCase())));
  const result = { Languages: [], Frameworks: [], Embedded: [], Tools: [], Cloud: [], Other: [] };
  for (const term of Array.from(all)) {
    if (!term) continue;
    let placed = false;
    for (const [cat, arr] of Object.entries(CATS)) {
      if (CATS[cat].some(k => term.includes(k))) { result[cat].push(cap(term)); placed = true; break; }
    }
    if (!placed) result.Other.push(cap(term));
  }
  for (const k of Object.keys(result)) result[k] = result[k].sort();
  return result;
}

function cap(s) { return s.replace(/\b\w/g, c => c.toUpperCase()); }

export default function ResumeTemplateClassic({ user, profile, result, overrides }) {
  const generated = result?.generated?.structure;
  const text = result?.extracted_text || '';
  const sections = useMemo(() => parseSections(text), [text]);
  const generatedSkillMap = useMemo(() => {
    if (!generated?.skillGroups?.length) return null;
    const map = {};
    generated.skillGroups.forEach(group => {
      if (!group) return;
      const key = group.label || 'Skills';
      const items = Array.isArray(group.items) ? group.items : [];
      if (!map[key]) map[key] = [];
      items.forEach(item => {
        const val = String(item || '').trim();
        if (!val) return;
        if (!map[key].includes(val)) map[key].push(val);
      });
    });
    return map;
  }, [generated]);
  const skills = useMemo(() => {
    if (generatedSkillMap) {
      const map = { ...generatedSkillMap };
      if (Array.isArray(overrides?.extraSkills) && overrides.extraSkills.length) {
        const extras = overrides.extraSkills.map(String);
        map.Other = Array.from(new Set([...(map.Other || []), ...extras]));
      }
      return map;
    }
    const base = categorizeSkills(result?.keywords?.good_terms_found || [], (sections.skills || []).join(' '));
    const add = (overrides?.extraSkills || []).map(s => String(s));
    add.forEach(term => {
      const lower = term.toLowerCase();
      if (/c\+\+|c\b|embedded|stm32|esp32|i2c|spi|uart|rtos/.test(lower)) base.Embedded.push(term);
      else if (/aws|azure|gcp|docker|kubernetes|ci\/cd/.test(lower)) base.Cloud.push(term);
      else if (/python|pandas|sql|pytorch|tensorflow|numpy/.test(lower)) base.Languages.push(term);
      else base.Other.push(term);
    });
    for (const k of Object.keys(base)) base[k] = Array.from(new Set(base[k]));
    return base;
  }, [generatedSkillMap, result, sections, overrides]);
  const baseName = (user?.name || user?.email?.split('@')[0] || 'Candidate').replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const name = generated?.name || baseName;
  const title = generated?.headline || profile?.target_title || 'Software/Embedded Engineer';

  const summary = generated?.summary || profile?.about || (sections.summary || []).slice(0, 3).join(' ');
  const eduLines = generated?.educationEntries || sections.education || [];
  const projLines = generated?.projectBullets?.map(b => `• ${b}`) || sections.projects || [];
  const expLines = generated?.experienceBullets?.map(b => `• ${b}`) || sections.experience || [];
  const achLines = generated?.achievements?.map(b => `• ${b}`) || sections.achievements || [];
  const contact = generated?.contact || {};

  function bullets(src, max=6) {
    const items = [];
    for (const ln of src) {
      const m = ln.match(/^•\s*(.+)$/) || ln.match(/^-\s*(.+)$/);
      if (m) items.push(m[1]);
    }
    return items.slice(0, max);
  }

  const expBullets = generated?.experienceBullets?.length ? generated.experienceBullets.slice(0, 8) : bullets(expLines, 8);
  const projBullets = generated?.projectBullets?.length ? generated.projectBullets.slice(0, 6) : bullets(projLines, 6);
  let achBullets = generated?.achievements?.length ? generated.achievements.slice(0, 6) : bullets(achLines, 6);
  if (Array.isArray(overrides?.extraBullets) && overrides.extraBullets.length) {
    achBullets = Array.from(new Set([...(achBullets || []), ...overrides.extraBullets]));
  }
  const contactItems = useMemo(() => {
    const items = [];
    if (contact.location) items.push(contact.location);
    if (contact.phone) items.push(contact.phone);
    if (contact.email) items.push(contact.email);
    else if (user?.email) items.push(user.email);
    if (contact.linkedin) items.push(contact.linkedin);
    if (contact.github) items.push(contact.github);
    if (contact.website) items.push(contact.website);
    return Array.from(new Set(items.filter(Boolean)));
  }, [contact, user?.email]);

  return (
    <div className="resume-doc">
      <div className="flex items-baseline justify-between border-b pb-2">
        <div>
          <h1>{name}</h1>
          <div className="text-sm text-gray-700">{title}{profile?.target_industry && !title?.includes(profile.target_industry) ? ` — ${profile.target_industry}` : ''}</div>
        </div>
        <div className="text-right text-sm space-y-0.5">
          {contactItems.length ? contactItems.map((item, i) => <div key={i}>{item}</div>) : <div>{user?.email}</div>}
        </div>
      </div>

      {summary && (
        <section className="mt-3">
          <h2>Summary</h2>
          <p>{summary}</p>
        </section>
      )}

      <section className="mt-3">
        <h2>Skills</h2>
        <div className="grid grid-cols-2 gap-x-6 text-sm">
          {Object.entries(skills).map(([cat, list]) => (
            list && list.length ? (
              <div key={cat}><strong>{cat}:</strong> {list.join(', ')}</div>
            ) : null
          ))}
        </div>
      </section>

      {expBullets.length ? (
        <section className="mt-3">
          <h2>Experience</h2>
          <ul className="list-disc ml-5">
            {expBullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>
      ) : null}

      {projBullets.length ? (
        <section className="mt-3">
          <h2>Projects</h2>
          <ul className="list-disc ml-5">
            {projBullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>
      ) : null}

      {eduLines.length ? (
        <section className="mt-3">
          <h2>Education</h2>
          <div className="text-sm whitespace-pre-wrap">{eduLines.join('\n')}</div>
        </section>
      ) : null}

      {achBullets.length ? (
        <section className="mt-3">
          <h2>Leadership & Achievements</h2>
          <ul className="list-disc ml-5">
            {achBullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
