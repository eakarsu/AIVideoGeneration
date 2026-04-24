const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');

const ai = async (prompt) => {
  const r = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
    messages: [{ role: 'user', content: prompt }]
  }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
  const c = r.data.choices[0].message.content;
  try { return JSON.parse(c); } catch { return { analysis: c }; }
};

router.post('/analyze-content', auth, async (req, res) => {
  try {
    const { video_title, description, duration, type } = req.body;
    const result = await ai(`Analyze video content: "${video_title}". Description: ${description}. Duration: ${duration}. Type: ${type || 'general'}. Return JSON with: content_summary, key_topics (array), detected_objects (array), mood_timeline (array with timestamp and mood), audience_engagement_predictions, content_rating, suggested_tags (array), accessibility_notes.`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generate-chapters', auth, async (req, res) => {
  try {
    const { video_title, transcript_excerpt, duration } = req.body;
    const result = await ai(`Generate chapter markers for video: "${video_title}". Duration: ${duration}. Transcript excerpt: ${transcript_excerpt}. Return JSON with: chapters (array with title, start_time, end_time, summary, key_points), total_chapters, suggested_thumbnail_times (array), table_of_contents.`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/create-highlights', auth, async (req, res) => {
  try {
    const { video_title, scenes_description, target_duration } = req.body;
    const result = await ai(`Create highlight reel from video: "${video_title}". Scenes: ${scenes_description}. Target highlight duration: ${target_duration || '2 minutes'}. Return JSON with: highlights (array with title, start_time, end_time, reason, impact_score), total_highlight_duration, narrative_flow, music_suggestions (array), transition_recommendations (array).`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
