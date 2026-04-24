const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM media_library ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM media_library WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, url, file_size, duration_seconds, resolution, format, tags } = req.body;
    const r = await pool.query(
      'INSERT INTO media_library (name, type, url, file_size, duration_seconds, resolution, format, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, type || 'video', url, file_size, duration_seconds, resolution, format || 'mp4', JSON.stringify(tags || [])]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, url, file_size, duration_seconds, resolution, format, tags } = req.body;
    const r = await pool.query(
      'UPDATE media_library SET name=$1, type=$2, url=$3, file_size=$4, duration_seconds=$5, resolution=$6, format=$7, tags=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, type, url, file_size, duration_seconds, resolution, format, JSON.stringify(tags || []), req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM media_library WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
