const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

/**
 * Build LaTeX source from resume data
 * @param {Object} options - Options containing user, profile, and result data
 * @returns {string} LaTeX source code
 */
function buildTex({ user, profile, result }) {
  const name = (user.email || 'Candidate').split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const title = profile?.target_title || 'Professional';
  const summary = profile?.about || '';
  
  // Basic LaTeX template
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}

\\begin{center}
{\\LARGE \\textbf{${name}}} \\\\
\\vspace{0.2cm}
{\\large ${title}}
\\end{center}

\\section*{Summary}
${summary}

\\section*{Skills}
${(result.keywords?.good_terms_found || []).join(', ')}

\\end{document}`;
}

/**
 * Compile LaTeX source to PDF
 * @param {string} tex - LaTeX source code
 * @param {string} outDir - Output directory
 * @returns {string} Path to compiled PDF
 */
function compileTex(tex, outDir) {
  const texPath = path.join(outDir, 'resume.tex');
  fs.writeFileSync(texPath, tex);
  
  // Try to compile with pdflatex
  const result = spawnSync('pdflatex', [
    '-interaction=nonstopmode',
    '-output-directory=' + outDir,
    texPath
  ], { encoding: 'utf-8', timeout: 30000 });
  
  const pdfPath = path.join(outDir, 'resume.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    throw new Error('PDF compilation failed: ' + (result.stderr || result.stdout || 'Unknown error'));
  }
  
  return pdfPath;
}

module.exports = {
  buildTex,
  compileTex
};
