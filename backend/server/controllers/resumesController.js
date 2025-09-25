const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../db');
const { getUserUploadsDir, getJobsDir } = require('../services/storage');
const { buildTex, compileTex } = require('../services/latex');
const { buildStructuredResume } = require('../services/resumeDraft');

// Multer storage to internal private storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = getUserUploadsDir(req.user.id);
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({ storage });

exports.uploadMiddleware = upload.single('file');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.user.id;
    const filename = req.file.originalname;
    const original_path = req.file.path;
    const r = await pool.query('INSERT INTO resumes (user_id, filename, original_path) VALUES ($1,$2,$3) RETURNING *', [userId, filename, original_path]);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('uploadResume error:', e.message || e);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
};

exports.analyzeResume = async (req, res) => {
  let jobId = null;
  try {
    const userId = req.user.id;
    const resumeId = parseInt(req.params.id, 10);
    if (!resumeId) return res.status(400).json({ error: 'Invalid resume id' });
    const r0 = await pool.query('SELECT * FROM resumes WHERE id = $1 AND user_id = $2', [resumeId, userId]);
    const resumeRow = r0.rows[0];
    if (!resumeRow) return res.status(404).json({ error: 'Resume not found' });

    // Insert job and prepare directories/files
    const job = await pool.query('INSERT INTO resume_jobs (user_id, resume_id, status) VALUES ($1,$2,$3) RETURNING *', [userId, resumeId, 'queued']);
    jobId = job.rows[0].id;
    const jobDir = getJobsDir(jobId);
    const outDir = path.join(jobDir, 'out');
    const inputDir = path.join(jobDir, 'input');
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(inputDir, { recursive: true });

    const srcPath = resumeRow.original_path;
    const destPath = path.join(inputDir, path.basename(srcPath));
    try { fs.copyFileSync(srcPath, destPath); } catch {}

    // Respond immediately; continue processing in background so UI never hangs
    try { await pool.query('UPDATE resume_jobs SET status=$1 WHERE id=$2', ['running', jobId]); } catch {}
    res.status(202).json({ job_id: jobId, status: 'queued' });

    // Background processing (fire-and-forget)
    setImmediate(async () => {
      try {
        console.log('[analyzeResume] start job', jobId, 'resume', resumeId);
        // Wire to Python analysis scripts under user's resume_ai project
        const PY_ROOT = '/home/droski/Desktop/School/Fall25/AI/resume_ai';
        const { spawnSync } = require('child_process');

        // 1) Run keywords.py
        const kwArgs = [path.join(PY_ROOT, 'keywords.py'), '--root', inputDir, '--outdir', outDir, '--keywords', path.join(PY_ROOT, 'resume_keywords.csv')];
        const kw = spawnSync('python3', kwArgs, { encoding: 'utf-8', timeout: Number(process.env.PY_TIMEOUT_KEYWORDS_MS || 60000) });
        if (kw.error && kw.error.code === 'ETIMEDOUT') {
          const errText = 'keywords.py timed out';
          await pool.query('UPDATE resume_jobs SET status = $1, error_text = $2 WHERE id = $3', ['error', errText, jobId]);
          console.error('[analyzeResume] keywords timeout job', jobId);
          return;
        }
        if (kw.status !== 0) {
          const errText = (kw.stderr || kw.stdout || '').toString().slice(0, 4000);
          await pool.query('UPDATE resume_jobs SET status = $1, error_text = $2 WHERE id = $3', ['error', errText, jobId]);
          console.error('[analyzeResume] keywords failed job', jobId, errText);
          return;
        }
        console.log('[analyzeResume] keywords ok for job', jobId);

        // 2) Optional clustering
        const ras = spawnSync('python3', [path.join(PY_ROOT, 'resume_analysis_sklearn.py')], { cwd: jobDir, encoding: 'utf-8', timeout: Number(process.env.PY_TIMEOUT_CLUSTER_MS || 20000) });
        let clusterOk = true;
        let clusterErr = '';
        if ((ras.error && ras.error.code === 'ETIMEDOUT') || ras.status !== 0) {
          clusterOk = false;
          clusterErr = ras && ras.error && ras.error.code === 'ETIMEDOUT'
            ? 'clustering timed out'
            : (ras && (ras.stderr || ras.stdout) ? (ras.stderr || ras.stdout).toString().slice(0, 4000) : 'clustering failed');
          console.warn('[analyzeResume] clustering skipped for job', jobId, 'reason:', clusterErr);
        } else {
          console.log('[analyzeResume] clustering ok for job', jobId);
        }

        // 3) Helpers
        function pyJson(cmd, args, opts) {
          const p = spawnSync(cmd, args, { timeout: Number(process.env.PY_TIMEOUT_PYJSON_MS || 5000), encoding: 'utf-8', ...(opts || {}) });
          if (p.error && p.error.code === 'ETIMEDOUT') return null;
          if (p.status !== 0) return null;
          try { return JSON.parse((p.stdout || '').toString()); } catch { return null; }
        }

        const absCopied = destPath;
        const pyFile = absCopied.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const kwRow = pyJson('python3', ['-c',
          `import pandas as pd, json, os; df=pd.read_csv(r'${path.join(outDir, 'resume_keyword_scores.csv')}');
try:
    target=os.path.basename(r'${pyFile}')
    m=df[df['filename'].apply(lambda s: os.path.basename(str(s))==target)]
except Exception:
    m=pd.DataFrame()
if m.empty and 'label' in df.columns:
    m=df[df['label'].astype(str).str.lower()=='input']
row={}
if not m.empty:
    try:
        m=m.sort_values(by=['good_hits'], ascending=False)
    except Exception:
        pass
    try:
        row=m.iloc[0].to_dict()
    except Exception:
        row={}
print(json.dumps(row))`
        ], { encoding: 'utf-8' });
        console.log('[analyzeResume] parsed keyword row for job', jobId, kwRow ? 'ok' : 'null');

        const clusterRow = clusterOk ? pyJson('python3', ['-c',
          `import pandas as pd, json; df=pd.read_csv(r'${path.join(outDir, 'cluster_assignments.csv')}');
row=df[df['filename']==r'${pyFile}'];
print(json.dumps(row.iloc[0].to_dict() if not row.empty else {}))`
        ], { encoding: 'utf-8' }) : null;
        if (clusterOk) console.log('[analyzeResume] parsed cluster row for job', jobId, clusterRow ? 'ok' : 'null');

const textRow = pyJson('python3', ['-c',
          `import pandas as pd, json, os; df=pd.read_csv(r'${path.join(outDir, 'resume_texts.csv')}');
try:
  target=os.path.basename(r'${pyFile}')
  m=df[df['filename'].apply(lambda s: os.path.basename(str(s))==target)]
except Exception:
  m=pd.DataFrame()
if m.empty and 'label' in df.columns:
  m=df[df['label'].astype(str).str.lower()=='input']
row={}
if not m.empty:
  try:
    row=m.iloc[0].to_dict()
  except Exception:
    row={}
print(json.dumps(row))`
        ], { encoding: 'utf-8' });
        console.log('[analyzeResume] parsed text row for job', jobId, textRow ? 'ok' : 'null');

        const profRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profRes.rows[0] || {};
        const namePart = (req.user && req.user.email ? req.user.email.split('@')[0] : 'Candidate').replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const topGood = (kwRow && kwRow.good_terms_found ? String(kwRow.good_terms_found).split(',').map(s=>s.trim()).filter(Boolean) : []).slice(0, 12);
        const certs = Array.isArray(profile.certs_json) ? profile.certs_json : (profile.certs_json ? [] : []);
        const accomps = Array.isArray(profile.accomplishments_json) ? profile.accomplishments_json : (profile.accomplishments_json ? [] : []);

        const generatedMD = [
          `# ${namePart}`,
          profile.target_title ? `\n**Target Role:** ${profile.target_title}${profile.target_industry ? ' — ' + profile.target_industry : ''}` : '',
          profile.degree ? `\n**Education:** ${profile.degree}` : '',
          profile.about ? `\n## Summary\n${profile.about}` : '',
          topGood.length ? `\n## Skills\n- ${topGood.join('\n- ')}` : '',
          profile.strengths ? `\n## Strengths\n${profile.strengths}` : '',
          certs.length ? `\n## Certifications\n- ${certs.join('\n- ')}` : '',
          accomps.length ? `\n## Key Accomplishments\n- ${accomps.join('\n- ')}` : ''
        ].filter(Boolean).join('\n');

        // Optional peer and capstone coverage (time-bounded)
        let peerCoverage = null;
        try {
          let csvPath = null;
          try {
            const peersSvc = require('../services/peers');
            const scanText = `${profile?.target_title || ''} ${profile?.target_industry || ''} ${(textRow && textRow.text ? String(textRow.text).slice(0,2000) : '')}`;
            csvPath = peersSvc.findPeerCsvForTitle(scanText);
          } catch {}
          if (csvPath) {
            const peer = pyJson('python3', ['-c',
              `import pandas as pd, json, re; df=pd.read_csv(r'${csvPath}');
ranked=df.sort_values(by=df.columns[-1], ascending=False).head(120)

def clean_term(t):
    t=str(t)
    t=re.sub(r"[^A-Za-z0-9+.#/ ]","",t)
    t=re.sub(r"\s+"," ",t).strip().lower()
    return t
terms=[clean_term(x) for x in ranked[df.columns[0]].astype(str).tolist() if clean_term(x)]
print(json.dumps(terms))`
            ], { encoding: 'utf-8' }) || [];
            const resumeText = (textRow && textRow.text ? String(textRow.text).toLowerCase() : '');
            const present = [], missing = [];
            for (const tok of peer) {
              const t = String(tok).toLowerCase();
              if (!t || t.length < 2) continue;
              if (resumeText.includes(t)) present.push(tok); else missing.push(tok);
            }
            const coverage = present.length / Math.max(1, present.length + missing.length);
            peerCoverage = { label_file: csvPath.split('/') .pop(), recommended_terms: peer, present_terms: present, missing_terms: missing, coverage };
          }
        } catch (peerErr) {
          console.warn('[analyzeResume] peer coverage failed for job', jobId, peerErr && (peerErr.message || peerErr));
        }

        let capstoneCoverage = null;
        try {
          const capDir = process.env.CAPSTONE_DIR;
          if (capDir && fs.existsSync(capDir)) {
            let capDomain = null;
            try {
              const peersSvc = require('../services/peers');
              const scanText = `${profile?.target_title || ''} ${profile?.target_industry || ''} ${(textRow && textRow.text ? String(textRow.text).slice(0,2000) : '')}`;
              capDomain = peersSvc.pickDomain(scanText);
            } catch {}
            const domainPattern = (capDomain === 'nursing')
              ? '(nurs|clinic|patient|care|emr|ehr|epic|hipaa|icu|er|triage|vital|medicat|chart|rn|lpn|bsn|msn|unit|ward|hospital|health)'
              : '';
            const py = [
              'import pandas as pd, json, os, re',
              `base=r'${(process.env.CAPSTONE_DIR||'').replace(/\\/g,'/')}';`,
              `p1=os.path.join(base,'01_people.csv'); p2=os.path.join(base,'02_abilities.csv'); p3=os.path.join(base,'03_education.csv'); p4=os.path.join(base,'04_experience.csv'); p5=os.path.join(base,'05_person_skills.csv'); p6=os.path.join(base,'06_skills.csv')`,
              'people=pd.read_csv(p1, dtype=str) if os.path.exists(p1) else pd.DataFrame()',
              'abilities=pd.read_csv(p2, dtype=str) if os.path.exists(p2) else pd.DataFrame()',
              'edu=pd.read_csv(p3, dtype=str) if os.path.exists(p3) else pd.DataFrame()',
              'exp=pd.read_csv(p4, dtype=str) if os.path.exists(p4) else pd.DataFrame()',
              'ps=pd.read_csv(p5, dtype=str) if os.path.exists(p5) else pd.DataFrame()',
              'skills_list=pd.read_csv(p6, dtype=str) if os.path.exists(p6) else pd.DataFrame()',
              `title=r'${(profile && profile.target_title ? profile.target_title : '').replace(/'/g,"''")}';`,
              `domain=r'${(capDomain||'generic').replace(/'/g,"''")}';`,
              `pat=re.compile(r'${domainPattern}') if r'${domainPattern}' else None`,
              'tokens=[t for t in re.split(r"[^a-z0-9]+", title.lower()) if t]',
              'sel=exp.copy()',
`if not sel.empty and tokens:
    mask=False
    for t in tokens:
        mask = (sel["title"].astype(str).str.lower().str.contains(t, na=False)) | mask
    sel=sel[mask]
`,
              `if sel.empty and domain!='generic':
    sel=exp[exp.astype(str).apply(lambda r: any([(pat.search(str(x).lower()) if pat else False) for x in r.values]), axis=1)] if pat is not None else exp
`,
              'if sel.empty: sel=exp',
              'pid=set(sel["person_id"].astype(str).tolist()) if not sel.empty else set()',
`skills=pd.Series(dtype=str)
if not ps.empty:
    if pid:
        skills=ps[ps["person_id"].astype(str).isin(pid)]["skill"].dropna().astype(str)
    else:
        skills=ps["skill"].dropna().astype(str)
`,
`abil=pd.Series(dtype=str)
if not abilities.empty:
    if pid:
        abil=abilities[abilities["person_id"].astype(str).isin(pid)]["ability"].dropna().astype(str)
    else:
        abil=abilities["ability"].dropna().astype(str)
`,
`if domain!='generic' and pat is not None:
    try:
        skills = skills[skills.astype(str).str.lower().str.contains(pat, na=False)]
        abil = abil[abil.astype(str).str.lower().str.contains(pat, na=False)]
    except Exception:
        pass
`,
`from collections import Counter

def clean_term(t):
    t = str(t).lower()
    t = re.sub(r"[^a-z0-9+.#/ ]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

all_terms=[clean_term(s) for s in pd.concat([skills,abil], ignore_index=True).tolist() if isinstance(s,str) and s.strip()]
counts=Counter(all_terms)
counts={k:v for k,v in counts.items() if len(k)>=2}
recommended=[k for k,_ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))][:200]
if domain=='nursing':
    bad={'state','city','city state','company','company city','new','information','quality','office','provided','client','clients','service','services','data','project','development','reporting','support','work','team','experience'}
    recommended=[k for k in recommended if k not in bad and len(k)>=3]
recommended=recommended[:120]
print(json.dumps(recommended))
`,
            ].join('\n');
            const rec = pyJson('python3', ['-c', py], { encoding: 'utf-8' }) || [];
            const resumeText = (textRow && textRow.text ? String(textRow.text).toLowerCase() : '');
            const resumeTextLower = resumeText;
            const present = [], missing = [];
            for (const tok of rec) {
              const t = String(tok).toLowerCase();
              if (!t || t.length < 2) continue;
              if (resumeText.includes(t)) present.push(tok); else missing.push(tok);
            }
            const coverage = present.length / Math.max(1, present.length + missing.length);
            capstoneCoverage = { recommended_terms: rec, present_terms: present, missing_terms: missing, coverage };
          }
        } catch (capErr) {
          console.warn('[analyzeResume] capstone coverage failed for job', jobId, capErr && (capErr.message || capErr));
        }

        // 7) Summaries
        const missingPeer = peerCoverage && Array.isArray(peerCoverage.missing_terms) ? peerCoverage.missing_terms : [];
        const missingCap = capstoneCoverage && Array.isArray(capstoneCoverage.missing_terms) ? capstoneCoverage.missing_terms : [];
        const uniqLower = (arr) => Array.from(new Set((arr || []).map((x) => String(x || '').toLowerCase())));
        const combinedMissing = uniqLower([...missingPeer, ...missingCap]).filter(Boolean).slice(0, 20);

        let resolvedDomain = null;
        try {
          const peersSvc = require('../services/peers');
          const scanText = `${profile?.target_title || ''} ${profile?.target_industry || ''} ${(textRow && textRow.text ? String(textRow.text).slice(0,2000) : '')}`;
          resolvedDomain = peersSvc.pickDomain(scanText);
        } catch {}

        let bullet_suggestions = [];
        const resumeTextLower = (textRow && textRow.text ? String(textRow.text).toLowerCase() : '');
        if (resolvedDomain === 'nursing') {
          const has = (kw) => resumeTextLower.includes(String(kw).toLowerCase());
          const emr = has('epic') ? 'Epic' : (has('emr') || has('ehr') ? 'EMR/EHR' : 'EMR');
          bullet_suggestions = [
            `Delivered patient-centered care across clinical rotations (add unit), recorded vitals, and updated care plans with the interdisciplinary team (add metric).`,
            `Documented in ${emr}, ensuring accurate charting, medication administration logs, and HIPAA-compliant handling of PHI.`,
            `Supported triage in high-acuity settings (ICU/ER), prioritized patients, and escalated changes in condition to RN/MD as needed.`,
            `Educated patients and families on discharge instructions and medication adherence to improve outcomes (add metric).`,
            `Maintained BLS/ACLS certification and adhered to infection control and safety protocols.`,
            `Collaborated with providers and staff to reduce wait times and improve patient satisfaction (add metric).`,
          ];
        } else {
          const verbs = ['Implemented', 'Optimized', 'Built', 'Automated', 'Integrated', 'Deployed', 'Designed', 'Refactored'];
          bullet_suggestions = combinedMissing.slice(0, 8).map((t, i) => {
            const v = verbs[i % verbs.length];
            return `${v} ${t} to improve reliability, performance, or developer experience (add metric).`;
          });
        }
        const summary_suggestion = (
          `Targeting ${profile?.target_title || 'Engineering'} roles. Consider adding coverage for: ` +
          combinedMissing.slice(0, 6).join(', ') +
          (topGood.length ? `. Strengths include: ${topGood.slice(0, 6).join(', ')}.` : '')
        );
        const recommendations = {
          skills_to_add: combinedMissing,
          bullet_suggestions,
          summary_suggestion,
        };

        function pickFamily(title, domain) {
          if (domain === 'nursing') return 'nursing';
          const t = (title || '').toLowerCase();
          if (/robot|ros|slam|perception/.test(t)) return 'robotics';
          if (/embedded|firmware|stm32|esp32|rtos|micro/.test(t)) return 'embedded';
          if (/data|ml|machine|ai|analytics|scientist/.test(t)) return 'data';
          if (/cloud|devops|platform|sre/.test(t)) return 'cloud';
          return 'software';
        }
        const family = pickFamily(profile?.target_title, resolvedDomain);
        const FAMILY_CRITICAL = {
          nursing: ['patient care', 'clinical', 'care plan', 'vitals', 'triage', 'medication administration', 'charting', 'emr', 'ehr', 'epic', 'hipaa', 'icu', 'er', 'bls', 'acls', 'cpr', 'rn', 'lpn', 'bsn'],
          embedded: ['c', 'c++', 'embedded c', 'rtos', 'spi', 'i2c', 'uart', 'dma', 'stm32', 'esp32', 'interrupt', 'hal', 'bare metal', 'freertos'],
          robotics: ['ros', 'ros2', 'slam', 'opencv', 'perception', 'sensor fusion', 'lidar', 'gazebo', 'navigation', 'planning'],
          data: ['python', 'pandas', 'numpy', 'scikit-learn', 'sql', 'etl', 'pytorch', 'tensorflow', 'statistics', 'visualization'],
          cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'terraform', 'linux', 'monitoring'],
          software: ['git', 'docker', 'api', 'testing', 'ci/cd', 'linux', 'javascript', 'python']
        };
        const requiredList = FAMILY_CRITICAL[family] || FAMILY_CRITICAL.software;
        const presentCritical = [];
        const missingCritical = [];
        for (const term of requiredList) {
          if (resumeTextLower.includes(String(term).toLowerCase())) presentCritical.push(term); else missingCritical.push(term);
        }
        const requiredMin = Math.min(6, requiredList.length);
        const requirements = {
          job_family: family,
          required_min: requiredMin,
          present_terms: presentCritical,
          missing_terms: missingCritical,
          satisfied: presentCritical.length >= requiredMin
        };

        let generated;
        try {
          const structured = buildStructuredResume({
            user: req.user,
            profile,
            rawText: textRow && textRow.text ? String(textRow.text) : '',
            topGood,
            recommendations,
            bulletSuggestions: bullet_suggestions,
            domain: resolvedDomain,
            capstoneCoverage,
            peerCoverage,
          });
          generated = {
            markdown: (structured && structured.markdown) || generatedMD,
            structure: structured && structured.structure,
            baseline_markdown: generatedMD,
          };
        } catch (genErr) {
          generated = { markdown: generatedMD };
          console.warn('buildStructuredResume failed:', genErr && (genErr.message || genErr));
        }

        const result = {
          cluster: {
            id: clusterRow && clusterRow.cluster !== undefined ? Number(clusterRow.cluster) : null,
            label: null,
            ok: clusterOk,
            error: clusterOk ? null : clusterErr,
          },
          rank: { zscore: null, cosine: null, percentile: null },
          attention: { score: null, top_terms: [], action_verbs: [], quantified_claims: null },
          keywords: {
            good_hits: kwRow && kwRow.good_hits !== undefined ? Number(kwRow.good_hits) : 0,
            bad_hits: kwRow && kwRow.bad_hits !== undefined ? Number(kwRow.bad_hits) : 0,
            good_terms_found: kwRow && kwRow.good_terms_found ? String(kwRow.good_terms_found).split(',').map(s=>s.trim()).filter(Boolean) : [],
            bad_terms_found: kwRow && kwRow.bad_terms_found ? String(kwRow.bad_terms_found).split(',').map(s=>s.trim()).filter(Boolean) : []
          },
          extracted_text: textRow && textRow.text ? String(textRow.text) : null,
          peer_coverage: peerCoverage,
          capstone_coverage: capstoneCoverage,
          requirements,
          recommendations,
          domain: resolvedDomain,
          generated,
          downloads: {},
          user_email: req.user && req.user.email ? String(req.user.email) : null
        };

        fs.writeFileSync(path.join(jobDir, 'result.json'), JSON.stringify(result, null, 2));
        await pool.query('UPDATE resume_jobs SET status = $1, result_json = $2, finished_at = now() WHERE id = $3', ['done', JSON.stringify(result), jobId]);
        console.log('[analyzeResume] job complete', jobId);
      } catch (e) {
        try {
          const msg = (e && (e.stack || e.message)) ? (e.stack || e.message) : String(e);
          await pool.query('UPDATE resume_jobs SET status = $1, error_text = $2 WHERE id = $3', ['error', msg.slice(0, 4000), jobId]);
        } catch {}
        console.error('analyzeResume background error:', e && (e.stack || e.message || e));
      }
    });
  } catch (e) {
    try {
      if (typeof jobId !== 'undefined' && jobId) {
        const msg = (e && (e.stack || e.message)) ? (e.stack || e.message) : String(e);
        await pool.query('UPDATE resume_jobs SET status = $1, error_text = $2 WHERE id = $3', ['error', msg.slice(0, 4000), jobId]);
      }
    } catch {/* ignore */}
    console.error('analyzeResume error:', e && (e.stack || e.message || e));
    res.status(500).json({ error: 'Failed to run analysis' });
  }
};

// Render latest job result to PDF via LaTeX
exports.renderPdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeId = parseInt(req.params.id, 10);
    const chk = await pool.query('SELECT id FROM resumes WHERE id = $1 AND user_id = $2', [resumeId, userId]);
    if (!chk.rows[0]) return res.status(404).json({ error: 'Resume not found' });
    const jr = await pool.query('SELECT * FROM resume_jobs WHERE resume_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1', [resumeId, userId]);
    const job = jr.rows[0];
    if (!job || !job.result_json) return res.status(404).json({ error: 'No result available' });

    const profRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    const profile = profRes.rows[0] || {};
    const result = job.result_json;

    const jobDir = getJobsDir(job.id);
    const outDir = path.join(jobDir, 'latex');
    require('fs').mkdirSync(outDir, { recursive: true });

    const tex = buildTex({ user: req.user, profile, result });
    const pdfPath = compileTex(tex, outDir);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resume_${resumeId}.pdf"`);
    require('fs').createReadStream(pdfPath).pipe(res);
  } catch (e) {
    console.error('renderPdf error:', e && (e.stack || e.message || e));
    res.status(500).json({ error: 'Failed to render PDF' });
  }
};

// Create a job without upload based on Profile only (for users who have no resume)
exports.newFromProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    const p = profRes.rows[0] || {};
    // Create a stub resume
    const r = await pool.query('INSERT INTO resumes (user_id, filename, original_path) VALUES ($1,$2,$3) RETURNING *', [userId, 'generated_from_profile.txt', `generated:${Date.now()}`]);
    const resumeId = r.rows[0].id;
    // Build a minimal result using profile and peer coverage engines above
    const job = await pool.query('INSERT INTO resume_jobs (user_id, resume_id, status) VALUES ($1,$2,$3) RETURNING *', [userId, resumeId, 'queued']);
    const jobId = job.rows[0].id;

    // Reuse coverage from analyzeResume path by calling internal function blocks would be complex;
    // For now create a simple result with extracted_text synthesized from profile.
    const extracted = [p.degree, p.target_title, p.target_industry, p.strengths, p.about, (p.certs_json||[]).join(', '), (p.accomplishments_json||[]).join(', ')].filter(Boolean).join('\n');
    const recommendations = { skills_to_add: [], bullet_suggestions: [], summary_suggestion: p.about || '' };

    let generated;
    try {
      const structured = buildStructuredResume({
        user: req.user,
        profile: p,
        rawText: extracted,
        recommendations,
        bulletSuggestions: [],
      });
      generated = {
        markdown: structured && structured.markdown,
        structure: structured && structured.structure,
        baseline_markdown: structured && structured.markdown,
      };
    } catch {
      generated = { markdown: `# ${(req.user.email||'').split('@')[0]}\n\n${p.about||''}` };
    }

    const result = {
      cluster: { id: null, label: null, ok: true, error: null },
      rank: { zscore: null, cosine: null, percentile: null },
      attention: { score: null, top_terms: [], action_verbs: [], quantified_claims: null },
      keywords: { good_hits: 0, bad_hits: 0, good_terms_found: [], bad_terms_found: [] },
      extracted_text: extracted,
      peer_coverage: null,
      capstone_coverage: null,
      requirements: null,
      recommendations,
      generated,
      downloads: {},
      user_email: req.user.email
    };

    await pool.query('UPDATE resume_jobs SET status=$1, result_json=$2, finished_at=now() WHERE id=$3', ['done', JSON.stringify(result), jobId]);

    res.status(201).json({ id: resumeId, job_id: jobId });
  } catch (e) {
    console.error('newFromProfile error:', e && (e.stack || e.message || e));
    res.status(500).json({ error: 'Failed to create resume from profile' });
  }
};

exports.getJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = parseInt(req.params.id, 10);
    const r = await pool.query('SELECT * FROM resume_jobs WHERE id = $1 AND user_id = $2', [jobId, userId]);
    const row = r.rows[0];
    if (!row) return res.status(404).json({ error: 'Job not found' });
    res.json(row);
  } catch (e) {
    console.error('getJob error:', e.message || e);
    res.status(500).json({ error: 'Failed to load job' });
  }
};

exports.getResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeId = parseInt(req.params.id, 10);
    const chk = await pool.query('SELECT id FROM resumes WHERE id = $1 AND user_id = $2', [resumeId, userId]);
    if (!chk.rows[0]) return res.status(404).json({ error: 'Resume not found' });
    const r = await pool.query('SELECT * FROM resume_jobs WHERE resume_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1', [resumeId, userId]);
    const job = r.rows[0];
    if (!job || !job.result_json) return res.status(404).json({ error: 'No result available' });
    res.json(job.result_json);
  } catch (e) {
    console.error('getResult error:', e.message || e);
    res.status(500).json({ error: 'Failed to load result' });
  }
};

// Save draft overrides (applied skills/bullets/style) on the latest job for a resume
exports.saveDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeId = parseInt(req.params.id, 10);
    const overrides = req.body || {};
    const chk = await pool.query('SELECT id FROM resumes WHERE id=$1 AND user_id=$2', [resumeId, userId]);
    if (!chk.rows[0]) return res.status(404).json({ error: 'Resume not found' });
    const jr = await pool.query('SELECT id, result_json FROM resume_jobs WHERE resume_id=$1 AND user_id=$2 ORDER BY id DESC LIMIT 1', [resumeId, userId]);
    if (!jr.rows[0]) return res.status(404).json({ error: 'No job found' });
    const jobId = jr.rows[0].id;
    const merged = jr.rows[0].result_json || {};
    merged.draft_overrides = overrides;
    await pool.query('UPDATE resume_jobs SET result_json = $1 WHERE id = $2', [merged, jobId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('saveDraft error:', e && (e.stack || e.message || e));
    res.status(500).json({ error: 'Failed to save draft' });
  }
};

// Reset draft overrides
exports.resetDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeId = parseInt(req.params.id, 10);
    const chk = await pool.query('SELECT id FROM resumes WHERE id=$1 AND user_id=$2', [resumeId, userId]);
    if (!chk.rows[0]) return res.status(404).json({ error: 'Resume not found' });
    const jr = await pool.query('SELECT id, result_json FROM resume_jobs WHERE resume_id=$1 AND user_id=$2 ORDER BY id DESC LIMIT 1', [resumeId, userId]);
    if (!jr.rows[0]) return res.status(404).json({ error: 'No job found' });
    const jobId = jr.rows[0].id;
    const merged = jr.rows[0].result_json || {};
    if (merged.draft_overrides) delete merged.draft_overrides;
    await pool.query('UPDATE resume_jobs SET result_json = $1 WHERE id = $2', [merged, jobId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('resetDraft error:', e && (e.stack || e.message || e));
    res.status(500).json({ error: 'Failed to reset draft' });
  }
};
