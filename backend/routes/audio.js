const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM audio_tracks ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM audio_tracks WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, url, duration_seconds, bpm, genre, mood, license } = req.body;
    const r = await pool.query(
      'INSERT INTO audio_tracks (name, type, url, duration_seconds, bpm, genre, mood, license) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, type || 'music', url, duration_seconds, bpm, genre, mood, license || 'royalty-free']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, url, duration_seconds, bpm, genre, mood, license } = req.body;
    const r = await pool.query(
      'UPDATE audio_tracks SET name=$1, type=$2, url=$3, duration_seconds=$4, bpm=$5, genre=$6, mood=$7, license=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, type, url, duration_seconds, bpm, genre, mood, license, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM audio_tracks WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
