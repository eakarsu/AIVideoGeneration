const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM transitions ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM transitions WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, duration_ms, easing, description, preview_url, config } = req.body;
    const r = await pool.query(
      'INSERT INTO transitions (name, type, duration_ms, easing, description, preview_url, config) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, type || 'fade', duration_ms || 500, easing || 'ease-in-out', description, preview_url, JSON.stringify(config || {})]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, duration_ms, easing, description, preview_url, config } = req.body;
    const r = await pool.query(
      'UPDATE transitions SET name=$1, type=$2, duration_ms=$3, easing=$4, description=$5, preview_url=$6, config=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, type, duration_ms, easing, description, preview_url, JSON.stringify(config || {}), req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM transitions WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
