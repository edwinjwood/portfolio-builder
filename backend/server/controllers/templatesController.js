const pool = require('../db');

exports.listTemplates = async (req, res) => {
  try {
    const templates = await pool.query('SELECT * FROM templates ORDER BY id');
    const templateIds = templates.rows.map(t => t.id);
    let components = [];
    if (templateIds.length > 0) {
      const compResult = await pool.query(
        'SELECT * FROM template_components WHERE template_id = ANY($1::int[]) ORDER BY position',
        [templateIds]
      );
      components = compResult.rows;
    }
    const componentsByTemplate = {};
    components.forEach(c => {
      if (!componentsByTemplate[c.template_id]) componentsByTemplate[c.template_id] = [];
      componentsByTemplate[c.template_id].push(c);
    });
    const result = templates.rows.map(t => ({ ...t, components: componentsByTemplate[t.id] || [] }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};
