const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM video_styles ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM video_styles WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, prompt_modifier, negative_prompt, preview_url, category, config } = req.body;
    const r = await pool.query(
      'INSERT INTO video_styles (name, description, prompt_modifier, negative_prompt, preview_url, category, config) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, prompt_modifier, negative_prompt, preview_url, category || 'artistic', JSON.stringify(config || {})]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, prompt_modifier, negative_prompt, preview_url, category, config } = req.body;
    const r = await pool.query(
      'UPDATE video_styles SET name=$1, description=$2, prompt_modifier=$3, negative_prompt=$4, preview_url=$5, category=$6, config=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, description, prompt_modifier, negative_prompt, preview_url, category, JSON.stringify(config || {}), req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM video_styles WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
