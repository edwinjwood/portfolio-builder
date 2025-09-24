const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function texEscape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\textbackslash ')
    .replace(/([#%&_{}])/g, '\\$1')
    .replace(/\$/g, '\\$')
    .replace(/\^/g, '\\textasciicircum ')
    .replace(/~/g, '\\textasciitilde ')
    .replace(/<|>/g, '');
}

function section(title) {
  return `\n\\section{${texEscape(title)}}\n`;
}

function bulletLine(t) {
  return `\\item ${texEscape(t)}`;
}

function itemizeBlock(items) {
  if (!items || !items.length) return '';
  return `\\begin{itemize}[leftmargin=0.15in]` + '\n' + items.map(bulletLine).join('\n') + '\n\\end{itemize}';
}

function skillLines(groups) {
  if (!groups || !groups.length) return [];
  const lines = [];
  for (const group of groups) {
    if (!group || !group.items || !group.items.length) continue;
    lines.push(`${group.label}: ${group.items.join(', ')}`);
  }
  return lines;
}

function resolveStructure({ user, profile, result }) {
  const fallback = {
    name: (user && (user.name || (user.email ? user.email.split('@')[0] : ''))) || 'Candidate',
    headline: profile && (profile.target_title || profile.target_industry) ? `${profile.target_title || ''}${profile.target_industry ? ` — ${profile.target_industry}` : ''}` : '',
    contact: { email: user && user.email ? user.email : null },
    summary: profile && profile.about ? profile.about : '',
    highlights: (result && result.recommendations && Array.isArray(result.recommendations.bullet_suggestions)) ? result.recommendations.bullet_suggestions : [],
    skillGroups: [],
    experienceBullets: [],
    projectBullets: [],
    educationEntries: profile && profile.degree ? [profile.degree] : [],
    certifications: Array.isArray(profile && profile.certs_json) ? profile.certs_json : [],
    achievements: Array.isArray(profile && profile.accomplishments_json) ? profile.accomplishments_json : [],
  };
  const generated = result && result.generated && result.generated.structure;
  if (!generated) return fallback;
  return {
    ...fallback,
    ...generated,
    contact: { ...(fallback.contact || {}), ...(generated.contact || {}) },
    highlights: (generated.highlights && generated.highlights.length) ? generated.highlights : fallback.highlights,
    skillGroups: (generated.skillGroups && generated.skillGroups.length) ? generated.skillGroups : fallback.skillGroups,
    experienceBullets: (generated.experienceBullets && generated.experienceBullets.length) ? generated.experienceBullets : fallback.experienceBullets,
    projectBullets: (generated.projectBullets && generated.projectBullets.length) ? generated.projectBullets : fallback.projectBullets,
    educationEntries: (generated.educationEntries && generated.educationEntries.length) ? generated.educationEntries : fallback.educationEntries,
    certifications: (generated.certifications && generated.certifications.length) ? generated.certifications : fallback.certifications,
    achievements: (generated.achievements && generated.achievements.length) ? generated.achievements : fallback.achievements,
  };
}

function buildTexPedro({ user, profile, result }) {
  const data = resolveStructure({ user, profile, result });
  const contactParts = [];
  if (data.contact && data.contact.location) contactParts.push(texEscape(data.contact.location));
  if (data.contact && data.contact.phone) contactParts.push(texEscape(data.contact.phone));
  if (data.contact && data.contact.email) contactParts.push(texEscape(data.contact.email));
  if (data.contact && data.contact.linkedin) contactParts.push(texEscape(data.contact.linkedin));
  if (data.contact && data.contact.github) contactParts.push(texEscape(data.contact.github));
  if (data.contact && data.contact.website) contactParts.push(texEscape(data.contact.website));
  const contactLine = contactParts.length ? contactParts.join(' $|$ ') : '';

  let headerLines = `{\\Huge \\scshape ${texEscape(data.name)}} \\ \\ \\vspace{1pt}`;
  if (data.headline) {
    headerLines += `\n${texEscape(data.headline)}`;
  }
  if (contactLine) {
    headerLines += data.headline ? ` \\ ${contactLine}` : `\n${contactLine}`;
  }
  const header = `\\begin{center}\n${headerLines}\n\\end{center}`;

  const summaryBlock = data.summary ? section('Summary') + `{\\small ${texEscape(data.summary)}}\\par` : '';
  const highlightsBlock = data.highlights && data.highlights.length ? section('Highlights') + itemizeBlock(data.highlights) : '';
  const skillsBlock = data.skillGroups && data.skillGroups.length ? section('Skills') + itemizeBlock(skillLines(data.skillGroups)) : '';
  const experienceBlock = data.experienceBullets && data.experienceBullets.length ? section('Experience') + itemizeBlock(data.experienceBullets) : '';
  const projectsBlock = data.projectBullets && data.projectBullets.length ? section('Projects') + itemizeBlock(data.projectBullets) : '';
  const educationBlock = data.educationEntries && data.educationEntries.length ? section('Education') + `{\\small ${data.educationEntries.map(e => texEscape(e)).join(' \\ ')}}\\par` : '';
  const certBlock = data.certifications && data.certifications.length ? section('Certifications') + itemizeBlock(data.certifications) : '';
  const achievementBlock = data.achievements && data.achievements.length ? section('Achievements') + itemizeBlock(data.achievements) : '';

  const tex = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\pdfgentounicode=1
\\pagestyle{fancy}\\fancyhf{}\\fancyfoot{}\\renewcommand{\\headrulewidth}{0pt}\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.6in}\\addtolength{\\evensidemargin}{-0.5in}\\addtolength{\\textwidth}{1.19in}\\addtolength{\\topmargin}{-0.7in}\\addtolength{\\textheight}{1.4in}
\\urlstyle{same}
\\raggedbottom\\raggedright\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries}{}{0em}{}{[\\color{black}\\titlerule \\vspace{-5pt}]}
\\begin{document}
${header}
${summaryBlock}
${highlightsBlock}
${skillsBlock}
${experienceBlock}
${projectsBlock}
${educationBlock}
${certBlock}
${achievementBlock}
\\end{document}`;
  return tex;
}

function buildTex({ user, profile, result }) {
  const style = String((result && result.draft_overrides && result.draft_overrides.latex_style) || process.env.LATEX_STYLE || 'default').toLowerCase();
  if (style === 'pedro') {
    return buildTexPedro({ user, profile, result });
  }
  const data = resolveStructure({ user, profile, result });
  const contactParts = [];
  if (data.contact && data.contact.location) contactParts.push(texEscape(data.contact.location));
  if (data.contact && data.contact.phone) contactParts.push(texEscape(data.contact.phone));
  if (data.contact && data.contact.email) contactParts.push(texEscape(data.contact.email));
  if (data.contact && data.contact.linkedin) contactParts.push(texEscape(data.contact.linkedin));
  if (data.contact && data.contact.github) contactParts.push(texEscape(data.contact.github));
  if (data.contact && data.contact.website) contactParts.push(texEscape(data.contact.website));
  const contactLine = contactParts.length ? contactParts.join(' $|$ ') : '';

  let headerLines = `{\\Huge \\scshape ${texEscape(data.name)}} \\ \\ \\vspace{1pt}`;
  if (data.headline) {
    headerLines += `\n${texEscape(data.headline)}`;
  }
  if (contactLine) {
    headerLines += data.headline ? ` \\ ${contactLine}` : `\n${contactLine}`;
  }
  const header = `\\begin{center}\n${headerLines}\n\\end{center}`;

  const summaryBlock = data.summary ? section('Summary') + `{\\small ${texEscape(data.summary)}}\\par` : '';
  const highlightsBlock = data.highlights && data.highlights.length ? section('Highlights') + itemizeBlock(data.highlights) : '';
  const skillsBlock = data.skillGroups && data.skillGroups.length ? section('Skills') + itemizeBlock(skillLines(data.skillGroups)) : '';
  const experienceBlock = data.experienceBullets && data.experienceBullets.length ? section('Experience') + itemizeBlock(data.experienceBullets) : '';
  const projectsBlock = data.projectBullets && data.projectBullets.length ? section('Projects') + itemizeBlock(data.projectBullets) : '';
  const educationBlock = data.educationEntries && data.educationEntries.length ? section('Education') + `{\\small ${data.educationEntries.map(e => texEscape(e)).join(' \\ ')}}\\par` : '';
  const certBlock = data.certifications && data.certifications.length ? section('Certifications') + itemizeBlock(data.certifications) : '';
  const achievementBlock = data.achievements && data.achievements.length ? section('Achievements') + itemizeBlock(data.achievements) : '';

  const tex = `\\documentclass[letterpaper,11pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\pagestyle{fancy}\\fancyhf{}\\fancyfoot{}\\renewcommand{\\headrulewidth}{0pt}\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}\\addtolength{\\textwidth}{1.0in}\\addtolength{\\topmargin}{-0.6in}\\addtolength{\\textheight}{1.2in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries}{}{0em}{}{[\\color{black}\\titlerule \\vspace{-5pt}]}
\\begin{document}
${header}
${summaryBlock}
${highlightsBlock}
${skillsBlock}
${experienceBlock}
${projectsBlock}
${educationBlock}
${certBlock}
${achievementBlock}
\\end{document}`;
  return tex;
}

function compileTex(texContent, outDir) {
  const texPath = path.join(outDir, 'resume.tex');
  fs.writeFileSync(texPath, texContent);
  const opts = { cwd: outDir, encoding: 'utf-8' };
  // Try xelatex then pdflatex
  let res = spawnSync('xelatex', ['-interaction=nonstopmode', 'resume.tex'], opts);
  if (res.status !== 0) {
    res = spawnSync('pdflatex', ['-interaction=nonstopmode', 'resume.tex'], opts);
  }
  const pdfPath = path.join(outDir, 'resume.pdf');
  if (!fs.existsSync(pdfPath)) {
    const err = (res.stderr || res.stdout || '').toString();
    throw new Error('LaTeX compile failed: ' + err.slice(0, 4000));
  }
  return pdfPath;
}

module.exports = { texEscape, buildTex, compileTex };
