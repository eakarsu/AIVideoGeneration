const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM render_queue ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM render_queue WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { project_name, resolution, format, quality, status, progress, estimated_time, output_url } = req.body;
    const r = await pool.query(
      'INSERT INTO render_queue (project_name, resolution, format, quality, status, progress, estimated_time, output_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [project_name, resolution || '1920x1080', format || 'mp4', quality || 'high', status || 'queued', progress || 0, estimated_time, output_url]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { project_name, resolution, format, quality, status, progress, estimated_time, output_url } = req.body;
    const r = await pool.query(
      'UPDATE render_queue SET project_name=$1, resolution=$2, format=$3, quality=$4, status=$5, progress=$6, estimated_time=$7, output_url=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [project_name, resolution, format, quality, status, progress, estimated_time, output_url, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM render_queue WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
