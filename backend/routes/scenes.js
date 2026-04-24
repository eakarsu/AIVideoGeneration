const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM scenes ORDER BY scene_order, created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM scenes WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, project_id, scene_order, duration_seconds, prompt, transition_in, transition_out, camera_motion } = req.body;
    const r = await pool.query(
      'INSERT INTO scenes (name, description, project_id, scene_order, duration_seconds, prompt, transition_in, transition_out, camera_motion) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, description, project_id, scene_order || 1, duration_seconds || 5, prompt, transition_in || 'fade', transition_out || 'fade', camera_motion || 'static']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, project_id, scene_order, duration_seconds, prompt, transition_in, transition_out, camera_motion } = req.body;
    const r = await pool.query(
      'UPDATE scenes SET name=$1, description=$2, project_id=$3, scene_order=$4, duration_seconds=$5, prompt=$6, transition_in=$7, transition_out=$8, camera_motion=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [name, description, project_id, scene_order, duration_seconds, prompt, transition_in, transition_out, camera_motion, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM scenes WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
