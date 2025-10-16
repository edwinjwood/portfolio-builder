import React, { useMemo } from 'react';

// Very light parser to pull key sections from extracted text
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
  function slice(fromKey, _toKey) {
    const a = idx[fromKey];
    if (a == null) return [];
    const next = Object.values(idx)
      .filter(v => v > a)
      .sort((x, y) => x - y)[0];
    return lines.slice(a + 1, next == null ? lines.length : next);
  }
  return {
    education: slice('education'),
    experience: slice('experience'),
    projects: slice('projects'),
    rawSkills: slice('skills'),
    rawLangs: slice('langs')
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
  // Deduplicate
  Object.keys(cats).forEach(k => cats[k] = Array.from(new Set(cats[k])));
  return cats;
}

export default function ResumeTemplatePedro({ user, profile, result, overrides }) {
  const name = (user?.name || user?.email?.split('@')[0] || 'Candidate').replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const title = profile?.target_title || 'Engineer';

  const sections = useMemo(() => parseSections(result?.extracted_text || ''), [result]);

  // Build Skills categories: use recommendations + applied extras
  const cats = useMemo(() => {
    const recSkills = result?.recommendations?.skills_to_add || [];
    const extra = overrides?.extraSkills || [];
    return categorize(recSkills, extra);
  }, [result?.recommendations?.skills_to_add, overrides?.extraSkills]);

  // Build bullets (Highlights) from suggestions + applied extras
  const bullets = Array.from(new Set([...(result?.recommendations?.bullet_suggestions || []), ...(overrides?.extraBullets || [])])).slice(0, 8);

  const contact = overrides?.contact || {};

  return (
    <div className="resume-doc resume-pedro">
      {/* Header */}
      <header className="pb-2 mb-3 border-b">
        <h1 className="text-3xl font-extrabold leading-tight">{name}</h1>
        <div className="text-sm text-gray-700">
          {title}{profile?.target_industry ? ` — ${profile.target_industry}` : ''}
        </div>
        <div className="text-xs text-gray-700 mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {contact.location ? <span>{contact.location}</span> : null}
          {contact.phone ? <span>{contact.phone}</span> : null}
          <span>{user?.email}</span>
          {contact.linkedin ? <span>{contact.linkedin}</span> : null}
          {contact.github ? <span>{contact.github}</span> : null}
        </div>
      </header>

      {/* Education */}
      {(profile?.degree || sections.education.length) ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Education</h2>
          <div className="text-sm whitespace-pre-wrap">
            {profile?.degree ? (<div className="mb-1">{profile.degree}</div>) : null}
            {sections.education.length ? sections.education.join('\n') : null}
          </div>
        </section>
      ) : null}

      {/* Related & Professional Experience */}
      {sections.experience.length ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Related & Professional Experience</h2>
          <div className="text-sm whitespace-pre-wrap">{sections.experience.join('\n')}</div>
        </section>
      ) : null}

      {/* Project Experience */}
      {sections.projects.length ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Project Experience</h2>
          <div className="text-sm whitespace-pre-wrap">{sections.projects.join('\n')}</div>
        </section>
      ) : null}

      {/* Highlights */}
      {bullets.length ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Highlights</h2>
          <ul className="list-disc ml-5 text-sm">
            {bullets.map((b,i)=>(<li key={i}>{b}</li>))}
          </ul>
        </section>
      ) : null}

      {/* Technical Skills (with categories) */}
      <section className="mb-3">
        <h2 className="text-lg font-semibold">Technical Skills</h2>
        <div className="text-sm space-y-1">
          {Object.entries(cats).map(([label, list]) => (
            list && list.length ? (
              <div key={label}><strong>{label.replace('FrameworksLibraries','Frameworks/Libraries')}:</strong> {list.join(', ')}</div>
            ) : null
          ))}
        </div>
      </section>

      {/* Languages */}
      {(sections.rawLangs && sections.rawLangs.length) ? (
        <section className="mb-3">
          <h2 className="text-lg font-semibold">Languages</h2>
          <div className="text-sm whitespace-pre-wrap">{sections.rawLangs.join('\n')}</div>
        </section>
      ) : null}
    </div>
  );
}
