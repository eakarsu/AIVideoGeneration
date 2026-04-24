const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM video_templates ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM video_templates WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, resolution, duration_seconds, style, thumbnail_url, config } = req.body;
    const r = await pool.query(
      'INSERT INTO video_templates (name, description, category, resolution, duration_seconds, style, thumbnail_url, config) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, description, category || 'general', resolution || '1920x1080', duration_seconds || 10, style || 'cinematic', thumbnail_url, JSON.stringify(config || {})]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, category, resolution, duration_seconds, style, thumbnail_url, config } = req.body;
    const r = await pool.query(
      'UPDATE video_templates SET name=$1, description=$2, category=$3, resolution=$4, duration_seconds=$5, style=$6, thumbnail_url=$7, config=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, description, category, resolution, duration_seconds, style, thumbnail_url, JSON.stringify(config || {}), req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM video_templates WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
