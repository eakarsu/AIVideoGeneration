const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM text_to_video ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM text_to_video WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { prompt, negative_prompt, duration_seconds, resolution, fps, style, model, status } = req.body;
    const result = await pool.query(
      'INSERT INTO text_to_video (prompt, negative_prompt, duration_seconds, resolution, fps, style, model, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [prompt, negative_prompt, duration_seconds || 4, resolution || '1280x720', fps || 24, style || 'cinematic', model || 'stable-video-diffusion', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { prompt, negative_prompt, duration_seconds, resolution, fps, style, model, status, output_url } = req.body;
    const result = await pool.query(
      'UPDATE text_to_video SET prompt=$1, negative_prompt=$2, duration_seconds=$3, resolution=$4, fps=$5, style=$6, model=$7, status=$8, output_url=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [prompt, negative_prompt, duration_seconds, resolution, fps, style, model, status, output_url, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM text_to_video WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
