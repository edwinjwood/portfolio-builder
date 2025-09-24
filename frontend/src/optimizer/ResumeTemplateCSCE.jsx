import React, { useMemo } from 'react';

function parseSections(text) {
  const s = (text || '').replace(/\r/g, '');
  const lines = s.split(/\n+/).map(t => t.trim());
  const idx = {};
  lines.forEach((t, i) => {
    const key = t.toLowerCase();
    if (key.startsWith('education')) idx.education = i;
    if (key.includes('related') && key.includes('experience')) idx.experience = i;
    if (key.startsWith('project') && key.includes('experience')) idx.projects = i;
    if (key.startsWith('technical skills')) idx.skills = i;
    if (key === 'languages') idx.langs = i;
  });
  function slice(fromKey) {
    const a = idx[fromKey];
    if (a == null) return [];
    const next = Object.values(idx).filter(v => v > a).sort((x, y) => x - y)[0];
    return lines.slice(a + 1, next == null ? lines.length : next);
  }
  return {
    education: slice('education'),
    experience: slice('experience'),
    projects: slice('projects'),
    rawSkills: slice('skills'),
    rawLangs: slice('langs'),
  };
}

function categorize(skills, extra = []) {
  const all = Array.from(new Set([...(skills || []), ...(extra || [])]))
    .map(s => String(s).trim())
    .filter(Boolean);
  const cats = {
    Languages: [],
    Embedded: [],
    Tools: [],
    FrameworksLibraries: [],
    Specialties: [],
  };
  all.forEach(term => {
    const t = term.toLowerCase();
    if (/\bc\+\+|\bc\b|python|java(script)?|typescript|swift|sql|matlab|bash|html|css/.test(t)) cats.Languages.push(term);
    else if (/arduino|esp32|i2c|spi|uart|pwm|gpio|rtos|memory/.test(t)) cats.Embedded.push(term);
    else if (/docker|git|github|ci\/cd|nvm|zsh|fusion|bambu|ltspice|linux|sqlite|azure|n8n|ngrok/.test(t)) cats.Tools.push(term);
    else if (/flask|streamlit|rest|pandas|numpy|pytorch|tensorflow|sklearn|whisper|moviepy|adafruit|u8g2|wifimanager|arduinojson|google test/.test(t)) cats.FrameworksLibraries.push(term);
    else cats.Specialties.push(term);
  });
  Object.keys(cats).forEach(k => (cats[k] = Array.from(new Set(cats[k]))));
  return cats;
}

export default function ResumeTemplateCSCE({ user, profile, result, overrides }) {
  const generated = result?.generated?.structure;
  const name = (generated?.name || user?.name || user?.email?.split('@')[0] || 'Candidate')
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  const title = generated?.headline || profile?.target_title || 'Computer Engineering / CS Candidate';

  const sections = useMemo(() => parseSections(result?.extracted_text || ''), [result]);
  const generatedSkillTerms = useMemo(() => {
    if (!generated?.skillGroups?.length) return [];
    return generated.skillGroups.flatMap(group => Array.isArray(group.items) ? group.items : []).map(String);
  }, [generated]);

  const cats = useMemo(() => {
    const recSkills = result?.recommendations?.skills_to_add || [];
    const extra = overrides?.extraSkills || [];
    const base = generatedSkillTerms.length ? generatedSkillTerms : recSkills;
    return categorize(base, extra);
  }, [generatedSkillTerms, result?.recommendations?.skills_to_add, overrides?.extraSkills]);

  const baseHighlights = generated?.highlights?.length ? generated.highlights : (result?.recommendations?.bullet_suggestions || []);
  const bullets = Array.from(new Set([...(baseHighlights || []), ...(overrides?.extraBullets || [])])).slice(0, 8);

  const contact = { ...(generated?.contact || {}), ...(overrides?.contact || {}) };
  if (!contact.email && user?.email) contact.email = user.email;

  const education = useMemo(() => {
    if (generated?.educationEntries?.length) return generated.educationEntries.join('\n');
    return (sections.education || []).join('\n');
  }, [generated, sections.education]);

  const experienceText = useMemo(() => {
    if (generated?.experienceBullets?.length) return generated.experienceBullets.map(b => `• ${b}`).join('\n');
    return (sections.experience || []).join('\n');
  }, [generated, sections.experience]);

  const projectText = useMemo(() => {
    if (generated?.projectBullets?.length) return generated.projectBullets.map(b => `• ${b}`).join('\n');
    return (sections.projects || []).join('\n');
  }, [generated, sections.projects]);

  const languageText = useMemo(() => {
    if (generated?.skillGroups?.length) {
      const langs = generated.skillGroups
        .filter(group => /language/i.test(group.label))
        .flatMap(group => group.items || []);
      if (langs.length) return langs.join(', ');
    }
    return (sections.rawLangs || []).join('\n');
  }, [generated, sections.rawLangs]);

  return (
    <div className="resume-doc resume-csce">
      <header className="pb-2 mb-3 border-b">
        <h1 className="text-3xl font-extrabold leading-tight">{name}</h1>
        <div className="text-sm text-gray-700">
          {title}
          {profile?.target_industry ? ` — ${profile.target_industry}` : ''}
        </div>
        <div className="text-xs text-gray-700 mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {contact.location ? <span>{contact.location}</span> : null}
          {contact.phone ? <span>{contact.phone}</span> : null}
          {contact.email ? <span>{contact.email}</span> : null}
          {contact.linkedin ? <span>{contact.linkedin}</span> : null}
          {contact.github ? <span>{contact.github}</span> : null}
          {contact.website ? <span>{contact.website}</span> : null}
        </div>
      </header>

      {(profile?.degree || education) && (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Education</h2>
          <div className="text-sm whitespace-pre-wrap">
            {profile?.degree ? <div className="mb-1">{profile.degree}</div> : null}
            {education}
          </div>
        </section>
      )}

      {experienceText ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Related & Professional Experience</h2>
          <div className="text-sm whitespace-pre-wrap">{experienceText}</div>
        </section>
      ) : null}

      {projectText ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Project Experience</h2>
          <div className="text-sm whitespace-pre-wrap">{projectText}</div>
        </section>
      ) : null}

      {bullets.length ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Highlights</h2>
          <ul className="list-disc ml-5 text-sm">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-3">
        <h2 className="text-lg font-semibold">Technical Skills</h2>
        <div className="text-sm space-y-1">
          {Object.entries(cats).map(([label, list]) =>
            list && list.length ? (
              <div key={label}>
                <strong>{label.replace('FrameworksLibraries', 'Frameworks/Libraries')}:</strong> {list.join(', ')}
              </div>
            ) : null
          )}
        </div>
      </section>

      {languageText ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Languages</h2>
          <div className="text-sm whitespace-pre-wrap">{languageText}</div>
        </section>
      ) : null}
    </div>
  );
}
