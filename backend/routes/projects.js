const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM video_projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM video_projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, resolution, fps, duration_seconds, status, style, aspect_ratio } = req.body;
    const result = await pool.query(
      'INSERT INTO video_projects (name, description, resolution, fps, duration_seconds, status, style, aspect_ratio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, description, resolution || '1920x1080', fps || 24, duration_seconds || 10, status || 'draft', style || 'cinematic', aspect_ratio || '16:9']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, resolution, fps, duration_seconds, status, style, aspect_ratio } = req.body;
    const result = await pool.query(
      'UPDATE video_projects SET name=$1, description=$2, resolution=$3, fps=$4, duration_seconds=$5, status=$6, style=$7, aspect_ratio=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, description, resolution, fps, duration_seconds, status, style, aspect_ratio, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM video_projects WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
