// Apply pass 5 — full backlog: music gen, voice-over, stock video, publish-to-platform.
//
// ENV vars (optional; endpoints return 503 with `missing: <ENV>` when unset):
//   MUSIC_GEN_API_KEY    — Suno/Riffusion/etc. (NEEDS-PRODUCT-DECISION + NEEDS-CREDS)
//   TTS_API_KEY          — ElevenLabs/Polly/etc. (NEEDS-CREDS)
//   STOCK_VIDEO_API_KEY  — Shutterstock/Storyblocks/etc. (NEEDS-CREDS)
//   YOUTUBE_OAUTH_TOKEN, TIKTOK_OAUTH_TOKEN — publish (NEEDS-CREDS)
//
// PRODUCT-DECISIONS:
//   - Music gen default provider: "suno" (override via MUSIC_GEN_PROVIDER).
//     We pick a single default to unblock UI; integrator swaps SDK call.
//   - TTS default voice: "neutral-1", default provider: "elevenlabs".
//   - Stock-video default provider: "shutterstock".
//   - Publish workflow: queue first, OAuth-authorized, status pollable.
const router = require('express').Router();
const auth = require('../middleware/auth');
const pool = require('../db');

let initPromise = null;
async function ensureSchema() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publish_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        platform VARCHAR(40) NOT NULL,
        video_url TEXT,
        title TEXT,
        description TEXT,
        status VARCHAR(20) DEFAULT 'queued',
        external_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  })().catch((e) => { initPromise = null; throw e; });
  return initPromise;
}

function envKeyOr503(res, name) {
  const v = process.env[name];
  if (!v || /your_.*_here/i.test(v)) {
    res.status(503).json({ error: `${name} not configured`, missing: name });
    return false;
  }
  return v;
}

// Music generation (NEEDS-PRODUCT-DECISION + NEEDS-CREDS) ---------
router.post('/music-gen', auth, async (req, res) => {
  const key = envKeyOr503(res, 'MUSIC_GEN_API_KEY');
  if (!key) return;
  const { prompt, duration_seconds = 30, mood } = req.body || {};
  res.json({
    provider: process.env.MUSIC_GEN_PROVIDER || 'suno',
    prompt: prompt || null,
    duration_seconds,
    mood: mood || 'neutral',
    status: 'queued',
    note: 'Music-gen wiring pending vendor SDK — set MUSIC_GEN_API_KEY/MUSIC_GEN_PROVIDER and replace stub.'
  });
});

// Voice-over TTS (NEEDS-CREDS) ------------------------------------
router.post('/tts/voiceover', auth, async (req, res) => {
  const key = envKeyOr503(res, 'TTS_API_KEY');
  if (!key) return;
  const { text, voice, language = 'en-US' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });
  res.json({
    provider: process.env.TTS_PROVIDER || 'elevenlabs',
    voice: voice || 'neutral-1',
    language,
    audio_url: null,
    status: 'queued',
    note: 'TTS wiring pending vendor SDK — set TTS_API_KEY and replace stub.'
  });
});

// Stock video search (NEEDS-CREDS) --------------------------------
router.get('/stock/search', auth, async (req, res) => {
  const key = envKeyOr503(res, 'STOCK_VIDEO_API_KEY');
  if (!key) return;
  const q = (req.query?.q || '').toString();
  res.json({
    provider: process.env.STOCK_VIDEO_PROVIDER || 'shutterstock',
    q,
    results: [],
    note: 'Stock video wiring pending vendor SDK — set STOCK_VIDEO_API_KEY.'
  });
});

// Publish to YouTube / TikTok (NEEDS-CREDS) ----------------------
router.post('/publish', auth, async (req, res) => {
  try {
    await ensureSchema();
    const platform = (req.body?.platform || 'youtube').toLowerCase();
    const requiredEnv = platform === 'youtube' ? 'YOUTUBE_OAUTH_TOKEN'
      : platform === 'tiktok' ? 'TIKTOK_OAUTH_TOKEN'
      : null;
    if (!requiredEnv) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }
    if (!process.env[requiredEnv] || /your_.*_here/i.test(process.env[requiredEnv])) {
      return res.status(503).json({ error: `${requiredEnv} not configured`, missing: requiredEnv });
    }
    const { video_url, title, description } = req.body || {};
    const r = await pool.query(
      'INSERT INTO publish_jobs (user_id, platform, video_url, title, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user?.id || null, platform, video_url || null, title || null, description || null]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/publish/jobs', auth, async (req, res) => {
  try {
    await ensureSchema();
    const r = await pool.query('SELECT * FROM publish_jobs ORDER BY id DESC LIMIT 100');
    res.json({ jobs: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
