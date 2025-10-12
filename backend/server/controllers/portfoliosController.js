const pool = require('../db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Helper: write a component JSON file to workspace so generated components are visible
// on the local filesystem. Files are stored under <repo>/generated_components/<portfolioId>/<type>.json
async function writeComponentToDisk(portfolioId, type, data) {
  try {
    const baseDir = path.join(__dirname, '..', '..', 'generated_components');
    const portfolioDir = path.join(baseDir, String(portfolioId));
    if (!fs.existsSync(portfolioDir)) fs.mkdirSync(portfolioDir, { recursive: true });
    const filePath = path.join(portfolioDir, `${type}.json`);
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  } catch (e) {
    // Non-fatal: log and continue
    console.warn(`writeComponentToDisk: failed to write component ${type} for portfolio ${portfolioId}`, e);
  }
}

// Configure multer storage for uploads (store in server/tmp/uploads)
const uploadDir = path.join(__dirname, '..', '..', 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`); }
});
const upload = multer({ storage });

exports.listPortfolios = async (req, res) => {
  const userId = req.user && req.user.id;
  try {
    const result = await pool.query('SELECT * FROM portfolios WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getPortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  const portfolioId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2',
      [portfolioId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found.' });
    const portfolio = result.rows[0];
    // Load component rows associated with this portfolio and merge into portfolio.components
    const comps = await pool.query('SELECT id, type, data FROM components WHERE portfolio_id = $1', [portfolioId]);
    const components = {};
    const componentRefs = {};
    if (comps.rows.length > 0) {
      comps.rows.forEach(c => { components[c.type] = c.data; componentRefs[c.type] = c.id; });
      portfolio.components = components;
      portfolio.component_refs = componentRefs;
    }
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Public portfolio GET (no auth) for rendering public portfolio pages
exports.getPortfolioPublic = async (req, res) => {
  const portfolioId = req.params.id;
  try {
    // Join with users to include owner display name for public pages
    const result = await pool.query(
      `SELECT p.*, u.id as owner_id, u.email as owner_email, u.name as owner_name, u.first_name as owner_first_name, u.last_name as owner_last_name
       FROM portfolios p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [portfolioId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found.' });
    const row = result.rows[0];
    // Merge owner fields into a simple owner object for frontend convenience
    const owner = {
      id: row.owner_id,
      email: row.owner_email,
      name: row.owner_name,
      first_name: row.owner_first_name,
      last_name: row.owner_last_name,
    };
    const portfolio = { ...row };
    portfolio.owner = owner;
    delete portfolio.owner_id; delete portfolio.owner_email; delete portfolio.owner_name; delete portfolio.owner_first_name; delete portfolio.owner_last_name;

    // Load component rows and merge data into portfolio.components for public views
    const comps = await pool.query('SELECT id, type, data FROM components WHERE portfolio_id = $1', [portfolioId]);
    if (comps.rows.length > 0) {
      const components = {};
      const componentRefs = {};
      comps.rows.forEach(c => { components[c.type] = c.data; componentRefs[c.type] = c.id; });
      portfolio.components = components;
      portfolio.component_refs = componentRefs;
    }

    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.createPortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  // The create endpoint now supports an atomic onboarding-create flow.
  // If the body includes `answers` (and optionally `resume`), we will
  // generate components server-side and insert them together with the
  // portfolio row so there are no half-created portfolios.
  const { name, answers, resume, templateId } = req.body;
  if (!name) return res.status(400).json({ error: 'Portfolio name required.' });

  try {
    // Fetch the full user record to obtain reliable name fields (JWT may only contain id/email)
    let displayName = name;
    try {
      if (userId) {
        const userRow = await pool.query('SELECT name, first_name, last_name, email FROM users WHERE id = $1', [userId]);
        if (userRow.rows.length > 0) {
          const u = userRow.rows[0];
          displayName = u.name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : name) || name;
        }
      }
    } catch (e) {
      console.warn('createPortfolio: failed to load user record for display name fallback', e);
      displayName = name;
    }
    let componentsToInsert = null;

    // If structured answers are provided, build a draft-like components object.
    if (Array.isArray(answers)) {
      const byId = answers.reduce((acc, a) => { acc[a.id] = a.value; return acc; }, {});
      // Basic canned components generation (same logic as onboardPortfolio)
      let role = byId.role || 'professional';
      let goal = byId.goal || 'showcase';

      componentsToInsert = {
          virtualbc: {
            // Use the authenticated user's name if available so the VC shows the real owner name
            title: displayName,
            subtitle: role === 'student' ? 'Student • Projects & learning' : 'Professional • Portfolio',
            contact: { email: req.user && req.user.email ? req.user.email : null },
          },
        resume: {
          headline: role === 'student' ? `Student portfolio for ${name}` : `About ${name}`,
          bullets: role === 'student' ? [
            'Course projects and academic highlights',
            'Relevant coursework and achievements',
          ] : [
            'Industry accomplishments and impact',
            'Key projects with metrics',
          ],
        },
        projects: {
          highlight: goal === 'job' ? 'Featured projects (concise, impact-first)' : 'Projects with context and learning notes',
        }
      };

      // If user indicated they do NOT have an existing resume, keep the generated stub only
      if (byId.resume_exists && byId.resume_exists === 'no') {
        // nothing extra required — componentsToInsert already contains stub resume
      }
    }

    // Resolve/validate templateId before inserting. The frontend sometimes
    // passes a URL-style template token (eg "1-v0") or a slug; the DB
    // expects an integer template_id. We'll try to resolve by slug/name first,
    // then fall back to parsing an integer. If neither works, return 400.
    let resolvedTemplateId = null;
    if (templateId !== undefined && templateId !== null) {
      // If it's already a number, use it directly
      if (Number.isInteger(templateId)) {
        resolvedTemplateId = templateId;
      } else if (typeof templateId === 'string') {
        // Try to find a matching template by slug or name
        try {
          const tRow = await pool.query('SELECT id FROM templates WHERE slug = $1 OR name = $1 LIMIT 1', [templateId]);
          if (tRow.rows && tRow.rows.length > 0) {
            resolvedTemplateId = tRow.rows[0].id;
          } else {
            // Fall back to parsing a leading integer (handles values like "1-v0")
            const parsed = parseInt(templateId, 10);
            if (!isNaN(parsed)) resolvedTemplateId = parsed;
            else return res.status(400).json({ error: 'Invalid template identifier' });
          }
        } catch (e) {
          // If templates table doesn't exist or query fails, try parsing integer
          const parsed = parseInt(templateId, 10);
          if (!isNaN(parsed)) resolvedTemplateId = parsed;
          else return res.status(400).json({ error: 'Invalid template identifier' });
        }
      } else {
        // Unsupported type
        return res.status(400).json({ error: 'Invalid template identifier' });
      }
    }

    // Insert the portfolio row first
    const insertQuery = 'INSERT INTO portfolios (user_id, name, template_id) VALUES ($1, $2, $3) RETURNING *';
    const insertParams = [userId, name, resolvedTemplateId || null];
    const result = await pool.query(insertQuery, insertParams);
    const portfolio = result.rows[0];

    // If the caller didn't provide structured answers (so we didn't generate components),
    // create a minimal virtual business card component so the workspace shows the owner's name
    // instead of the raw portfolio name. This matches the expected example behavior.
    if (!componentsToInsert) {
      try {
        const userRow = await pool.query('SELECT name, first_name, last_name, email FROM users WHERE id = $1', [userId]);
        let ownerDisplay = name;
        let ownerEmail = null;
        if (userRow && userRow.rows && userRow.rows.length > 0) {
          const u = userRow.rows[0];
          ownerDisplay = u.name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : name) || name;
          ownerEmail = u.email || null;
        }
        const vc = {
          title: ownerDisplay,
          subtitle: 'Professional • Portfolio',
          contact: { email: ownerEmail },
        };
  const resComp = await pool.query('INSERT INTO components (portfolio_id, type, data) VALUES ($1, $2, $3) RETURNING id, data', [portfolio.id, 'virtualbc', vc]);
  const persistedComponents = { virtualbc: resComp.rows[0].data };
  const persistedRefs = { virtualbc: resComp.rows[0].id };
  await pool.query('UPDATE portfolios SET components = $1, updated_at = now() WHERE id = $2', [persistedComponents, portfolio.id]);
  portfolio.components = persistedComponents;
  portfolio.component_refs = persistedRefs;
  // Persist component JSON to disk for developer visibility
  await writeComponentToDisk(portfolio.id, 'virtualbc', persistedComponents.virtualbc);
      } catch (e) {
        console.warn('createPortfolio: failed to persist default virtualbc', e);
      }
    }
    // If we generated componentsToInsert, persist each component into the components table
    // and then update the portfolios.components mapping to reference persisted data (for backward compatibility
    // the frontend still expects components as JSON content, so we'll store the actual JSON in components table
    // and then set portfolios.components to include that JSON as well).
    if (componentsToInsert) {
      // Make sure the virtual business card title reflects the owner's real name
      try {
        const userRow = await pool.query('SELECT name, first_name, last_name, email FROM users WHERE id = $1', [portfolio.user_id]);
        if (userRow && userRow.rows && userRow.rows.length > 0) {
          const u = userRow.rows[0];
          const ownerDisplay = u.name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : portfolio.name) || portfolio.name;
          if (componentsToInsert.virtualbc) componentsToInsert.virtualbc.title = ownerDisplay;
          if (componentsToInsert.virtualbc && !componentsToInsert.virtualbc.contact) componentsToInsert.virtualbc.contact = { email: u.email || null };
        }
      } catch (e) {
        console.warn('createPortfolio: could not fetch owner name before persisting components', e);
      }

      const compEntries = Object.entries(componentsToInsert);
      const persistedComponents = {};
      const persistedRefs = {};
      for (const [type, data] of compEntries) {
        const resComp = await pool.query(
          'INSERT INTO components (portfolio_id, type, data) VALUES ($1, $2, $3) RETURNING id, data',
          [portfolio.id, type, data]
        );
        persistedComponents[type] = resComp.rows[0].data;
        persistedRefs[type] = resComp.rows[0].id;
        // write each component JSON to disk
        await writeComponentToDisk(portfolio.id, type, persistedComponents[type]);
      }
      // Update portfolios.components column with the actual components JSON so older code paths still work
      await pool.query('UPDATE portfolios SET components = $1, updated_at = now() WHERE id = $2', [persistedComponents, portfolio.id]);
      portfolio.components = persistedComponents;
      portfolio.component_refs = persistedRefs;
    }

    // Build a components preview using the same logic we use for persistence so the frontend
    // can immediately show what the virtual business card will look like without waiting
    // for DB writes to propagate. This preview mirrors persisted components when present.
    let componentsPreview = null;
    try {
      // If we persisted components, use them as preview
      if (portfolio.components) {
        componentsPreview = portfolio.components;
      } else if (componentsToInsert) {
        componentsPreview = componentsToInsert;
      } else if (portfolio.component_refs && portfolio.component_refs.virtualbc) {
        // try to read the persisted virtualbc row
        const compRow = await pool.query('SELECT data FROM components WHERE id = $1', [portfolio.component_refs.virtualbc]);
        if (compRow && compRow.rows && compRow.rows.length > 0) componentsPreview = { virtualbc: compRow.rows[0].data };
      }
      // Fallback: build a minimal virtualbc preview using the displayName we calculated earlier
      if (!componentsPreview) {
        componentsPreview = {
          virtualbc: {
            title: displayName,
            subtitle: 'Professional • Portfolio',
            contact: { email: req.user && req.user.email ? req.user.email : null }
          }
        };
      }
    } catch (e) {
      console.warn('createPortfolio: failed to build componentsPreview', e);
    }

    // Return the portfolio plus a local-only componentsPreview that the frontend can display
    return res.status(201).json({ ...portfolio, componentsPreview });
  } catch (err) {
    console.error('createPortfolio error', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.deletePortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  const portfolioId = req.params.id;
  try {
    const result = await pool.query(
      'DELETE FROM portfolios WHERE id = $1 AND user_id = $2 RETURNING *',
      [portfolioId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found or not owned by user.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Simple synchronous onboarding endpoint that returns a generated draft for the portfolio.
// This is intentionally simple: it demonstrates the API contract for the frontend.
// Later this can be replaced with a call to an AI service and persisting results.
exports.onboardPortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  const portfolioId = req.params.id;
  const { messages } = req.body; // Expect an array of messages from the frontend chat UI

  try {
    // Verify ownership
    const check = await pool.query('SELECT * FROM portfolios WHERE id = $1 AND user_id = $2', [portfolioId, userId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found.' });

    // Build a simple canned draft using the portfolio name and structured answers (preferred)
    const portfolio = check.rows[0];
    const providedAnswers = Array.isArray(req.body.answers) ? req.body.answers : null;

    // Default role and goal
    let role = 'professional';
    let goal = 'showcase';
    // Make byId available in outer scope so later persistence logic can reference it
    let byId = {};
    if (providedAnswers) {
      byId = providedAnswers.reduce((acc, a) => { acc[a.id] = a.value; return acc; }, {});
      if (byId.role) role = byId.role;
      if (byId.goal) goal = byId.goal;
    }

    const summaryParts = [];
    if (role === 'student') summaryParts.push('Student portfolio focused on projects and learning.');
    else if (role === 'both') summaryParts.push('Student and professional—show both education and industry work.');
    else summaryParts.push('Professional portfolio highlighting industry experience.');

    if (goal === 'job') summaryParts.push('Optimized for job hunting and recruiter screening.');
    else if (goal === 'learn') summaryParts.push('Designed as a learning record and public practice space.');
    else summaryParts.push('Focused on showcasing projects and skills.');

    // Prefer owner's profile name for the draft virtual business card
    // Fetch owner name from DB for the draft (JWT payload may not include name fields)
    let ownerName = portfolio.name;
    try {
      if (userId) {
        const userRow = await pool.query('SELECT name, first_name, last_name, email FROM users WHERE id = $1', [userId]);
        if (userRow.rows.length > 0) {
          const u = userRow.rows[0];
          ownerName = u.name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : portfolio.name) || portfolio.name;
        }
      }
    } catch (e) {
      console.warn('onboardPortfolio: failed to load user record for owner name fallback', e);
      ownerName = portfolio.name;
    }
    const draft = {
      id: portfolio.id,
      name: portfolio.name,
      summary: `${summaryParts.join(' ')}`,
      components: {
        virtualbc: {
          title: ownerName,
          subtitle: role === 'student' ? 'Student • Projects & learning' : 'Professional • Portfolio',
          contact: {
            email: req.user && req.user.email ? req.user.email : null,
          },
        },
        resume: {
          headline: role === 'student' ? `Student portfolio for ${portfolio.name}` : `About ${portfolio.name}`,
          bullets: role === 'student' ? [
            'Course projects and academic highlights',
            'Relevant coursework and achievements',
          ] : [
            'Industry accomplishments and impact',
            'Key projects with metrics',
          ],
        },
        projects: {
          highlight: goal === 'job' ? 'Featured projects (concise, impact-first)' : 'Projects with context and learning notes',
        }
      },
      generated_at: new Date().toISOString(),
    };

    // If the user indicated they do NOT have a resume, persist a minimal
    // portfolio consisting of the generated components (homecard + stub resume)
    // so the frontend can immediately show the new portfolio. This is an
    // MVP approach that stores components as JSON on the portfolios row.
    try {
      if (providedAnswers && byId.resume_exists === 'no') {
        // Ensure the persisted virtualbc title uses the owner's DB name where possible
        const componentsToPersist = draft.components;
        try {
          const userRow = await pool.query('SELECT name, first_name, last_name, email FROM users WHERE id = $1', [portfolio.user_id]);
          if (userRow && userRow.rows && userRow.rows.length > 0) {
            const u = userRow.rows[0];
            const ownerDisplay = u.name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : portfolio.name) || portfolio.name;
            if (componentsToPersist.virtualbc) componentsToPersist.virtualbc.title = ownerDisplay;
            if (componentsToPersist.virtualbc && !componentsToPersist.virtualbc.contact) componentsToPersist.virtualbc.contact = { email: u.email || null };
          }
        } catch (e) {
          console.warn('onboardPortfolio: could not fetch owner name before persisting generated components', e);
        }

        const upd = await pool.query(
          'UPDATE portfolios SET components = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING *',
          [componentsToPersist, portfolioId, userId]
        );
        if (upd.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found.' });
        // Write persisted components to disk for visibility
        try {
          const cp = componentsToPersist;
          for (const t of Object.keys(cp)) {
            await writeComponentToDisk(portfolioId, t, cp[t]);
          }
        } catch (e) { /* non-fatal */ }
        // Return both the draft and the updated portfolio row and a local-only
        // componentsPreview so the frontend can immediately render and edit
        // the components locally (without needing to read from DB again).
        return res.json({ draft, portfolio: upd.rows[0], componentsPreview: componentsToPersist });
      }
    } catch (e) {
      console.error('Failed to persist generated components during onboarding:', e);
      return res.status(500).json({ error: 'Failed to persist portfolio components.' });
    }

  // Default: return the draft synchronously (no persistence) and include
  // a componentsPreview property that the frontend can use for local edits.
  res.json({ draft, componentsPreview: draft.components });
  } catch (err) {
    console.error('onboardPortfolio error', err);
    res.status(500).json({ error: 'Server error during onboarding.' });
  }
};

// Update or create a component for a portfolio.
// PATCH /api/portfolios/:id/components/:componentId
// Body: { data: { ... } }
exports.updateComponent = async (req, res) => {
  const userId = req.user && req.user.id;
  const portfolioId = req.params.id;
  const componentId = req.params.componentId; // optional
  const { data, type } = req.body;

  // Debug logging to help trace 404s during development
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`updateComponent called - userId=${userId} portfolioId=${portfolioId} componentId=${componentId} type=${type}`);
    console.debug('body sample keys:', Object.keys(req.body || {}));
  }

  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Component data (JSON) required.' });

  try {
    // Ownership check
    const check = await pool.query('SELECT * FROM portfolios WHERE id = $1 AND user_id = $2', [portfolioId, userId]);
    if (check.rows.length === 0) {
      console.warn(`updateComponent: portfolio not found or not owned - portfolioId=${portfolioId} userId=${userId}`);
      return res.status(404).json({ error: 'Portfolio not found.' });
    }

    if (componentId) {
      // Update existing component by id
      const upd = await pool.query('UPDATE components SET data = $1, updated_at = now() WHERE id = $2 AND portfolio_id = $3 RETURNING id, type, data', [data, componentId, portfolioId]);
      if (upd.rows.length === 0) {
        console.warn(`updateComponent: component id ${componentId} not found for portfolio ${portfolioId}`);
        return res.status(404).json({ error: 'Component not found.' });
      }
      // Also persist the updated component JSON to disk for developer visibility
      try {
        await writeComponentToDisk(portfolioId, upd.rows[0].type, data);
      } catch (e) {
        // non-fatal
        console.warn('updateComponent: failed to write component to disk', e);
      }
      // Also update portfolios.components JSON column for compatibility
      // Rebuild components JSON from current rows
      const comps = await pool.query('SELECT type, data FROM components WHERE portfolio_id = $1', [portfolioId]);
      const components = {};
      comps.rows.forEach(c => { components[c.type] = c.data; });
      await pool.query('UPDATE portfolios SET components = $1, updated_at = now() WHERE id = $2', [components, portfolioId]);
      return res.json(upd.rows[0]);
    }

    // If no componentId provided, try to upsert by (portfolio_id,type)
  if (!type) return res.status(400).json({ error: 'Component type required when creating or upserting.' });
    // See if a component of this type already exists
    const exists = await pool.query('SELECT id FROM components WHERE portfolio_id = $1 AND type = $2', [portfolioId, type]);
    if (exists.rows.length > 0) {
      const id = exists.rows[0].id;
  const upd = await pool.query('UPDATE components SET data = $1, updated_at = now() WHERE id = $2 RETURNING id, type, data', [data, id]);
  // Write updated component to disk
  try { await writeComponentToDisk(portfolioId, type, data); } catch (e) { /* non-fatal */ }
      // rebuild portfolio.components
      const comps = await pool.query('SELECT type, data FROM components WHERE portfolio_id = $1', [portfolioId]);
      const components = {};
      comps.rows.forEach(c => { components[c.type] = c.data; });
      await pool.query('UPDATE portfolios SET components = $1, updated_at = now() WHERE id = $2', [components, portfolioId]);
      return res.json(upd.rows[0]);
    }

  // Insert new component row
  const ins = await pool.query('INSERT INTO components (portfolio_id, type, data) VALUES ($1, $2, $3) RETURNING id, type, data', [portfolioId, type, data]);
  // Write newly inserted component to disk
  try { await writeComponentToDisk(portfolioId, type, data); } catch (e) { /* non-fatal */ }
    // rebuild portfolio.components and set refs
    const comps2 = await pool.query('SELECT type, data, id FROM components WHERE portfolio_id = $1', [portfolioId]);
    const components2 = {};
    const refs = {};
    comps2.rows.forEach(c => { components2[c.type] = c.data; refs[c.type] = c.id; });
    await pool.query('UPDATE portfolios SET components = $1, updated_at = now() WHERE id = $2', [components2, portfolioId]);
    return res.status(201).json({ component: ins.rows[0], component_refs: refs });
  } catch (err) {
    console.error('updateComponent error', err);
    res.status(500).json({ error: 'Server error updating component.' });
  }
};

// Handler for resume upload. Expects multipart/form-data with field 'resume'
exports.uploadResume = [
  upload.single('resume'),
  async (req, res) => {
    try {
      const userId = req.user && req.user.id;
      const portfolioId = req.params.id;
      // Basic ownership check
      const check = await pool.query('SELECT * FROM portfolios WHERE id = $1 AND user_id = $2', [portfolioId, userId]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found.' });

      if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

      // Respond with a basic resume info object that frontend can use
      const resumeInfo = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploaded_at: new Date().toISOString(),
      };

      // TODO: persist resume meta to DB or external storage

      res.json({ resume: resumeInfo });
    } catch (err) {
      console.error('uploadResume error', err);
      res.status(500).json({ error: 'Server error during resume upload.' });
    }
  }
];
