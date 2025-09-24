const CLEAN_BULLET = /^[\u2022\-\*\u2013\u2014]+\s*/;
const HEADERS = [
  { key: 'summary', regex: /(professional\s+summary|summary|profile|objective)/i },
  { key: 'skills', regex: /(skills?|technologies|technical\s+skills|competencies)/i },
  { key: 'experience', regex: /(experience|employment|work\s+history|professional\s+experience)/i },
  { key: 'projects', regex: /(projects?|project\s+experience|technical\s+projects)/i },
  { key: 'education', regex: /(education|academic)/i },
  { key: 'certifications', regex: /(certifications?|licenses?)/i },
  { key: 'achievements', regex: /(achievements?|leadership|awards)/i },
];
const CONTACT_REGEX = /(linkedin\.com|github\.com|@|\b\d{3}[\)\-\s]|portfolio|www\.|http:\/\/|https:\/\/|\b[0-9]{5}\b|,\s*[A-Z]{2}\b)/i;
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_REGEX = /(https?:\/\/)?(www\.)?linkedin\.com\/[A-Za-z0-9_\/-]+/i;
const GITHUB_REGEX = /(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_\/-]+/i;
const URL_REGEX = /(https?:\/\/[^\s|]+)/i;
const LOCATION_REGEX = /([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z]{2})(?:\s*\d{5})?/;
const VERB_PREFIXES = ['Led', 'Owned', 'Delivered', 'Implemented', 'Optimized', 'Built', 'Automated', 'Integrated', 'Improved', 'Designed', 'Developed'];

function toTitleCase(str) {
  if (!str) return '';
  const clean = String(str).trim().replace(/[\u2022\-\*]/g, '');
  if (!clean) return '';
  return clean
    .split(/\s+/)
    .map(word => {
      if (!word.length) return word;
      const lower = word.toLowerCase();
      if (lower === lower.toUpperCase()) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function unique(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list || []) {
    const v = String(raw || '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function isContactLine(line) {
  if (!line) return false;
  return CONTACT_REGEX.test(line);
}

function detectHeader(line) {
  if (!line) return null;
  for (const h of HEADERS) {
    if (h.regex.test(line)) return h.key;
  }
  return null;
}

function parseSections(raw) {
  const sections = {
    preface: [],
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    achievements: [],
    other: [],
  };
  if (!raw) return sections;
  const lines = String(raw)
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!lines.length) return sections;

  sections.preface.push(lines[0]);
  let current = 'summary';
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const header = detectHeader(line);
    if (header) {
      current = header;
      continue;
    }
    if (!sections.preface.includes(line) && (i < 5 && isContactLine(line))) {
      sections.preface.push(line);
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  }
  return sections;
}

function parseContact(preface, fallbackEmail) {
  const contact = { email: fallbackEmail || null, phone: null, location: null, linkedin: null, github: null, website: null };
  if (!Array.isArray(preface)) return contact;
  const joined = preface.join(' | ');
  const emailMatch = joined.match(EMAIL_REGEX);
  if (emailMatch) contact.email = emailMatch[0];
  const phoneMatch = joined.match(PHONE_REGEX);
  if (phoneMatch) contact.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
  const linkedinMatch = joined.match(LINKEDIN_REGEX);
  if (linkedinMatch) contact.linkedin = linkedinMatch[0].replace(/https?:\/\//i, '').replace(/^www\./i, '');
  const githubMatch = joined.match(GITHUB_REGEX);
  if (githubMatch) contact.github = githubMatch[0].replace(/https?:\/\//i, '').replace(/^www\./i, '');
  if (!contact.linkedin) {
    const linkedinText = preface.find(line => line.toLowerCase().includes('linkedin'));
    if (linkedinText) contact.linkedin = linkedinText.split('|').map(s => s.trim()).find(s => s.toLowerCase().includes('linkedin')) || contact.linkedin;
  }
  if (!contact.github) {
    const githubText = preface.find(line => line.toLowerCase().includes('github'));
    if (githubText) contact.github = githubText.split('|').map(s => s.trim()).find(s => s.toLowerCase().includes('github')) || contact.github;
  }
  const urlMatch = joined.match(URL_REGEX);
  if (urlMatch && !urlMatch[0].toLowerCase().includes('linkedin') && !urlMatch[0].toLowerCase().includes('github')) {
    contact.website = urlMatch[0].replace(/https?:\/\//i, '').replace(/^www\./i, '');
  }
  for (const segment of preface) {
    const parts = segment.split('|').map(s => s.trim());
    for (const part of parts) {
      if (!contact.location && LOCATION_REGEX.test(part)) {
        contact.location = part;
      }
    }
    if (contact.location) break;
  }
  return contact;
}

function extractBullets(lines, { max = 8, allowSentences = true } = {}) {
  if (!Array.isArray(lines) || !lines.length) return [];
  const bullets = [];
  let current = '';
  const flush = () => {
    const text = current.trim();
    if (text) bullets.push(cleanSentence(text));
    current = '';
  };
  for (const raw of lines) {
    const line = String(raw || '').trim();
    if (!line) continue;
    if (CLEAN_BULLET.test(line)) {
      if (current) flush();
      current = line.replace(CLEAN_BULLET, '').trim();
      continue;
    }
    if (current) {
      current += ` ${line}`;
      continue;
    }
    if (allowSentences && /[.!]$/.test(line)) {
      bullets.push(cleanSentence(line));
    }
  }
  if (current) flush();
  const deduped = unique(bullets).slice(0, max);
  return deduped;
}

function cleanSentence(text) {
  const t = String(text || '').replace(/[\u2022\-\*]/g, '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const normalized = t.charAt(0).toUpperCase() + t.slice(1);
  return normalized.replace(/\.$/, '') + '.';
}

function splitTerms(text) {
  if (!text) return [];
  return String(text)
    .split(/[,;\n\u2022]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

const SKILL_GROUPS = [
  { label: 'Languages', regex: /(python|java|c\+\+|c#|c\b|typescript|javascript|sql|swift|go|rust|matlab|bash|shell|html|css)/i },
  { label: 'Frameworks & Libraries', regex: /(react|node|express|flask|django|pandas|numpy|scikit|tensorflow|pytorch|spring|next\.js|angular|vue|fastapi|matplotlib|tailwind)/i },
  { label: 'Cloud & DevOps', regex: /(aws|azure|gcp|docker|kubernetes|terraform|ci\/cd|jenkins|github actions|linux|monitoring|devops|ansible|helm)/i },
  { label: 'Data & Analytics', regex: /(sql|etl|data|analytics|power bi|tableau|statistics|visualization|spark|dbt|warehouse|snowflake)/i },
  { label: 'Embedded & Hardware', regex: /(embedded|firmware|stm32|esp32|rtos|i2c|spi|uart|fpga|verilog|vhdl|pcb|hardware|sensor|microcontroller)/i },
  { label: 'Tools & Platforms', regex: /(git|jira|confluence|figma|notion|unity|autocad|solidworks|fusion|ltspice|labview|photoshop|illustrator|weasyprint)/i },
  { label: 'Soft Skills', regex: /(leadership|communication|collaboration|mentorship|stakeholder|problem solving|strategic|team|cross-functional|adaptability)/i },
];

function categorizeSkills(terms) {
  const buckets = SKILL_GROUPS.map(group => ({ label: group.label, items: [] }));
  const additional = [];
  for (const raw of unique(terms)) {
    const lower = raw.toLowerCase();
    let placed = false;
    for (let i = 0; i < SKILL_GROUPS.length; i += 1) {
      if (SKILL_GROUPS[i].regex.test(lower)) {
        buckets[i].items.push(formatSkill(raw));
        placed = true;
        break;
      }
    }
    if (!placed) additional.push(formatSkill(raw));
  }
  const filtered = buckets.filter(bucket => bucket.items.length);
  if (additional.length) filtered.push({ label: 'Additional', items: unique(additional) });
  return filtered;
}

function formatSkill(skill) {
  const clean = String(skill || '').trim();
  if (!clean) return '';
  if (clean === clean.toUpperCase() && clean.length <= 5) return clean;
  return clean
    .split(/[\s\/]+/)
    .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildEducationEntries(profile, lines) {
  const entries = [];
  if (profile && profile.degree) entries.push(String(profile.degree).trim());
  for (const line of lines || []) {
    if (!line) continue;
    const clean = line.replace(/[\u2022\-\*]/g, '').trim();
    if (clean) entries.push(clean);
  }
  return unique(entries).slice(0, 6);
}

function ensureHighlights(bullets, fallbackTerms) {
  const highlights = unique(bullets).slice(0, 6);
  if (highlights.length >= 3) return highlights;
  const toAdd = [];
  for (const term of fallbackTerms || []) {
    const normalized = String(term || '').trim();
    if (!normalized) continue;
    toAdd.push(`${pickVerb(highlights.length + toAdd.length)} ${normalized} initiatives to drive measurable impact.`);
    if (highlights.length + toAdd.length >= 6) break;
  }
  return unique([...highlights, ...toAdd]).slice(0, 6);
}

function pickVerb(index) {
  return VERB_PREFIXES[index % VERB_PREFIXES.length];
}

function buildMarkdown(structure) {
  const out = [];
  if (structure.name) out.push(`# ${structure.name}`);
  const contactParts = [];
  if (structure.contact.location) contactParts.push(structure.contact.location);
  if (structure.contact.phone) contactParts.push(structure.contact.phone);
  if (structure.contact.email) contactParts.push(structure.contact.email);
  if (structure.contact.linkedin) contactParts.push(structure.contact.linkedin);
  if (structure.contact.github) contactParts.push(structure.contact.github);
  if (structure.contact.website) contactParts.push(structure.contact.website);
  if (contactParts.length) out.push(contactParts.join(' | '));
  if (structure.headline) out.push(structure.headline);
  out.push('');
  if (structure.summary) {
    out.push('## Summary');
    out.push(structure.summary.trim());
    out.push('');
  }
  if (structure.highlights && structure.highlights.length) {
    out.push('## Highlights');
    for (const h of structure.highlights) out.push(`- ${h}`);
    out.push('');
  }
  if (structure.skillGroups && structure.skillGroups.length) {
    out.push('## Skills');
    for (const group of structure.skillGroups) {
      if (!group.items || !group.items.length) continue;
      out.push(`- **${group.label}:** ${group.items.join(', ')}`);
    }
    out.push('');
  }
  if (structure.experienceBullets && structure.experienceBullets.length) {
    out.push('## Experience');
    for (const b of structure.experienceBullets) out.push(`- ${b}`);
    out.push('');
  }
  if (structure.projectBullets && structure.projectBullets.length) {
    out.push('## Projects');
    for (const b of structure.projectBullets) out.push(`- ${b}`);
    out.push('');
  }
  if (structure.educationEntries && structure.educationEntries.length) {
    out.push('## Education');
    for (const e of structure.educationEntries) out.push(`- ${e}`);
    out.push('');
  }
  if (structure.certifications && structure.certifications.length) {
    out.push('## Certifications');
    for (const c of structure.certifications) out.push(`- ${c}`);
    out.push('');
  }
  if (structure.achievements && structure.achievements.length) {
    out.push('## Achievements');
    for (const a of structure.achievements) out.push(`- ${a}`);
    out.push('');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function buildStructuredResume(options) {
  const {
    user = {},
    profile = {},
    rawText = '',
    topGood = [],
    recommendations = {},
    bulletSuggestions = [],
    domain = null,
    capstoneCoverage = null,
    peerCoverage = null,
  } = options || {};

  const sections = parseSections(rawText);
  const contact = parseContact(sections.preface || [], user.email || null);
  const nameLine = sections.preface && sections.preface.length ? sections.preface[0] : (user.name || (user.email ? user.email.split('@')[0] : ''));
  const name = toTitleCase(nameLine) || toTitleCase(user.name) || toTitleCase(user.email ? user.email.split('@')[0] : 'Candidate');

  const headlineParts = [];
  if (profile.target_title) headlineParts.push(profile.target_title);
  if (profile.target_industry) headlineParts.push(profile.target_industry);
  const headline = headlineParts.join(' — ') || (domain ? `${toTitleCase(domain)} Professional` : 'Candidate');

  const summaryParts = [];
  if (profile.about) summaryParts.push(String(profile.about).trim());
  if (!summaryParts.length && sections.summary && sections.summary.length) {
    const sentences = sections.summary.slice(0, 3).join(' ');
    if (sentences) summaryParts.push(sentences.trim());
  }
  if (!summaryParts.length && profile.strengths) summaryParts.push(String(profile.strengths).trim());
  const missingTerms = recommendations.skills_to_add || [];
  if (summaryParts.length) {
    const tail = missingTerms.slice(0, 3).map(term => term && term.toLowerCase()).filter(Boolean);
    if (tail.length) {
      summaryParts.push(`Focused on expanding coverage for ${unique(tail).join(', ')}.`);
    }
  }
  const summary = summaryParts.join(' ');

  const strengths = splitTerms(profile.strengths);
  const skillTerms = [
    ...(recommendations.skills_to_add || []),
    ...(topGood || []),
    ...(capstoneCoverage && Array.isArray(capstoneCoverage.present_terms) ? capstoneCoverage.present_terms : []),
    ...(peerCoverage && Array.isArray(peerCoverage.present_terms) ? peerCoverage.present_terms : []),
    ...strengths,
    ...(sections.skills || []),
  ].map(term => String(term || '').replace(CLEAN_BULLET, '').trim()).filter(Boolean);

  const skillGroups = categorizeSkills(skillTerms);

  const experienceBullets = ensureHighlights(
    extractBullets(sections.experience || [], { max: 8, allowSentences: true }),
    missingTerms
  );

  const projectBullets = extractBullets(sections.projects || [], { max: 6, allowSentences: true });
  const educationEntries = buildEducationEntries(profile, sections.education);
  const achievementLines = extractBullets(sections.achievements || [], { max: 6, allowSentences: true });
  const achievements = unique([...(profile.accomplishments_json || []), ...achievementLines]);
  const certifications = unique([...(profile.certs_json || []), ...(sections.certifications || [])]).slice(0, 8);

  const highlights = ensureHighlights(bulletSuggestions || [], missingTerms);

  const structure = {
    name,
    headline,
    contact,
    summary,
    highlights,
    skillGroups,
    experienceBullets,
    projectBullets,
    educationEntries,
    certifications,
    achievements,
    domain,
    sections,
  };

  const markdown = buildMarkdown(structure);

  return { markdown, structure };
}

module.exports = { buildStructuredResume };
