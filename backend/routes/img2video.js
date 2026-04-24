const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM image_to_video ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM image_to_video WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, image_url, motion_prompt, duration_seconds, motion_strength, model, status } = req.body;
    const result = await pool.query(
      'INSERT INTO image_to_video (name, image_url, motion_prompt, duration_seconds, motion_strength, model, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, image_url, motion_prompt, duration_seconds || 4, motion_strength || 0.7, model || 'stable-video-diffusion', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, image_url, motion_prompt, duration_seconds, motion_strength, model, status, output_url } = req.body;
    const result = await pool.query(
      'UPDATE image_to_video SET name=$1, image_url=$2, motion_prompt=$3, duration_seconds=$4, motion_strength=$5, model=$6, status=$7, output_url=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, image_url, motion_prompt, duration_seconds, motion_strength, model, status, output_url, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM image_to_video WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
