const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM ai_prompts ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM ai_prompts WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, prompt, negative_prompt, category, style, tags } = req.body;
    const r = await pool.query(
      'INSERT INTO ai_prompts (name, prompt, negative_prompt, category, style, tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, prompt, negative_prompt, category || 'general', style || 'cinematic', JSON.stringify(tags || [])]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, prompt, negative_prompt, category, style, tags } = req.body;
    const r = await pool.query(
      'UPDATE ai_prompts SET name=$1, prompt=$2, negative_prompt=$3, category=$4, style=$5, tags=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, prompt, negative_prompt, category, style, JSON.stringify(tags || []), req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM ai_prompts WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
