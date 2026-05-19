const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// In-memory storage for generation rules (resolution + length)
let generationRules = [
  { id: 1, name: 'Social Short', resolution: '1080x1920', length_seconds: 15, max_size_mb: 50, format: 'mp4', notes: 'Vertical short for IG/TikTok' },
  { id: 2, name: 'YouTube Standard', resolution: '1920x1080', length_seconds: 60, max_size_mb: 200, format: 'mp4', notes: 'Horizontal HD' },
  { id: 3, name: '4K Cinematic', resolution: '3840x2160', length_seconds: 30, max_size_mb: 500, format: 'mov', notes: 'High-quality cinematic spot' },
];
let nextRuleId = 4;

// VIZ 1: Render queue timeline data
router.get('/render-timeline', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, project_name, status, progress, resolution, estimated_time,
              created_at, updated_at
       FROM render_queue
       ORDER BY created_at DESC
       LIMIT 30`
    );
    const items = r.rows.map(row => {
      const start = new Date(row.created_at).getTime();
      const end = new Date(row.updated_at || row.created_at).getTime();
      const durationMs = Math.max(end - start, 1000);
      return {
        id: row.id,
        label: row.project_name || `Job #${row.id}`,
        status: row.status,
        progress: row.progress || 0,
        resolution: row.resolution,
        eta: row.estimated_time,
        start_ts: start,
        end_ts: end,
        duration_ms: durationMs,
      };
    });
    const minTs = items.length ? Math.min(...items.map(i => i.start_ts)) : Date.now();
    const maxTs = items.length ? Math.max(...items.map(i => i.end_ts)) : Date.now() + 3600000;
    res.json({ count: items.length, min_ts: minTs, max_ts: maxTs, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIZ 2: Style usage heatmap (style x model)
router.get('/style-heatmap', auth, async (req, res) => {
  try {
    const t2v = await pool.query(
      `SELECT COALESCE(style,'unknown') AS style, COALESCE(model,'unknown') AS model, COUNT(*)::int AS cnt
       FROM text_to_video GROUP BY style, model`
    );
    const i2v = await pool.query(
      `SELECT 'image' AS style, COALESCE(model,'unknown') AS model, COUNT(*)::int AS cnt
       FROM image_to_video GROUP BY model`
    );
    const stylesSet = new Set();
    const modelsSet = new Set();
    const cellMap = {};
    [...t2v.rows, ...i2v.rows].forEach(r => {
      stylesSet.add(r.style);
      modelsSet.add(r.model);
      const k = `${r.style}||${r.model}`;
      cellMap[k] = (cellMap[k] || 0) + r.cnt;
    });
    const styles = Array.from(stylesSet).sort();
    const models = Array.from(modelsSet).sort();
    const cells = [];
    let max = 0;
    styles.forEach(s => {
      models.forEach(m => {
        const v = cellMap[`${s}||${m}`] || 0;
        if (v > max) max = v;
        cells.push({ style: s, model: m, count: v });
      });
    });
    res.json({ styles, models, cells, max });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NON-VIZ 1: Video brief PDF (text/plain "PDF-like" doc)
router.get('/brief-pdf/:projectId', auth, async (req, res) => {
  try {
    const id = req.params.projectId;
    const proj = await pool.query('SELECT * FROM video_projects WHERE id=$1', [id]);
    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const p = proj.rows[0];
    const scenes = await pool.query('SELECT * FROM scenes WHERE project_id=$1 ORDER BY scene_order', [id]);

    const lines = [];
    lines.push('%PDF-1.4');
    lines.push('% AI Video Studio Brief');
    lines.push('');
    lines.push('========================================');
    lines.push(`  VIDEO BRIEF: ${p.name}`);
    lines.push('========================================');
    lines.push('');
    lines.push(`Project ID: ${p.id}`);
    lines.push(`Description: ${p.description || '(none)'}`);
    lines.push(`Resolution: ${p.resolution}`);
    lines.push(`FPS: ${p.fps}`);
    lines.push(`Duration: ${p.duration_seconds}s`);
    lines.push(`Style: ${p.style}`);
    lines.push(`Aspect Ratio: ${p.aspect_ratio}`);
    lines.push(`Status: ${p.status}`);
    lines.push('');
    lines.push('----- SCENES -----');
    if (scenes.rows.length === 0) {
      lines.push('(no scenes attached)');
    } else {
      scenes.rows.forEach(s => {
        lines.push(`#${s.scene_order} ${s.name} [${s.duration_seconds}s]`);
        lines.push(`  Prompt: ${s.prompt || '-'}`);
        lines.push(`  Transitions: ${s.transition_in} -> ${s.transition_out}`);
        lines.push(`  Camera: ${s.camera_motion}`);
      });
    }
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('%EOF');

    const body = lines.join('\n');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="brief-${id}.pdf"`);
    res.send(body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NON-VIZ 2: Generation rules CRUD
router.get('/rules', auth, (req, res) => {
  res.json(generationRules);
});

router.post('/rules', auth, (req, res) => {
  const { name, resolution, length_seconds, max_size_mb, format, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const rule = {
    id: nextRuleId++,
    name,
    resolution: resolution || '1920x1080',
    length_seconds: Number(length_seconds) || 30,
    max_size_mb: Number(max_size_mb) || 100,
    format: format || 'mp4',
    notes: notes || '',
  };
  generationRules.push(rule);
  res.status(201).json(rule);
});

router.put('/rules/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = generationRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const cur = generationRules[idx];
  const { name, resolution, length_seconds, max_size_mb, format, notes } = req.body || {};
  generationRules[idx] = {
    ...cur,
    name: name ?? cur.name,
    resolution: resolution ?? cur.resolution,
    length_seconds: length_seconds !== undefined ? Number(length_seconds) : cur.length_seconds,
    max_size_mb: max_size_mb !== undefined ? Number(max_size_mb) : cur.max_size_mb,
    format: format ?? cur.format,
    notes: notes ?? cur.notes,
  };
  res.json(generationRules[idx]);
});

router.delete('/rules/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = generationRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const removed = generationRules.splice(idx, 1)[0];
  res.json({ message: 'Deleted', rule: removed });
});

module.exports = router;
