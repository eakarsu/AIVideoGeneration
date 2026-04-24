const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM export_presets ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM export_presets WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, format, codec, resolution, bitrate, fps, quality, description } = req.body;
    const r = await pool.query(
      'INSERT INTO export_presets (name, format, codec, resolution, bitrate, fps, quality, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, format || 'mp4', codec || 'h264', resolution || '1920x1080', bitrate || '8000k', fps || 24, quality || 'high', description]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, format, codec, resolution, bitrate, fps, quality, description } = req.body;
    const r = await pool.query(
      'UPDATE export_presets SET name=$1, format=$2, codec=$3, resolution=$4, bitrate=$5, fps=$6, quality=$7, description=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [name, format, codec, resolution, bitrate, fps, quality, description, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM export_presets WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
