const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const auth = require('./middleware/auth');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api', auth);
app.use('/api/media-workflow', require('./routes/mediaWorkflow'));
app.use(/^\/api\/(?:ai(?:\/|$)|gap-|integrations?(?:\/|$)|webhooks?(?:\/|$)|style-recommendation|music-generation|voice-over-synthesis|video-editing-suggestions|viral-score-prediction|collaboration-layer)/, (_req,res)=>res.status(503).json({error:'generated/direct-provider endpoints are quarantined; use media-workflow deliveries'}));
// Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/text2video', require('./routes/text2video'));
app.use('/api/img2video', require('./routes/img2video'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/storyboards', require('./routes/storyboards'));
app.use('/api/scenes', require('./routes/scenes'));
app.use('/api/media', require('./routes/media'));
app.use('/api/transitions', require('./routes/transitions'));
app.use('/api/audio', require('./routes/audio'));
app.use('/api/styles', require('./routes/styles'));
app.use('/api/renderqueue', require('./routes/renderqueue'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/video-agents', require('./routes/videoAgents'));
// Apply pass 5 — backlog: music-gen, voice-over, stock video, publish-to-platform
app.use('/api/integrations', require('./routes/integrations'));

// Dashboard stats
const pool = require('./db');
app.get('/api/dashboard', require('./middleware/auth'), async (req, res) => {
  try {
    const [projects, text2video, img2video, templates, storyboards, scenes, media, transitions, audio, styles, renders, exports, prompts] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM video_projects'),
      pool.query('SELECT COUNT(*) as count FROM text_to_video'),
      pool.query('SELECT COUNT(*) as count FROM image_to_video'),
      pool.query('SELECT COUNT(*) as count FROM video_templates'),
      pool.query('SELECT COUNT(*) as count FROM storyboards'),
      pool.query('SELECT COUNT(*) as count FROM scenes'),
      pool.query('SELECT COUNT(*) as count FROM media_library'),
      pool.query('SELECT COUNT(*) as count FROM transitions'),
      pool.query('SELECT COUNT(*) as count FROM audio_tracks'),
      pool.query('SELECT COUNT(*) as count FROM video_styles'),
      pool.query('SELECT COUNT(*) as count FROM render_queue'),
      pool.query('SELECT COUNT(*) as count FROM export_presets'),
      pool.query('SELECT COUNT(*) as count FROM ai_prompts'),
    ]);
    res.json({
      projects: parseInt(projects.rows[0].count),
      text2video: parseInt(text2video.rows[0].count),
      img2video: parseInt(img2video.rows[0].count),
      templates: parseInt(templates.rows[0].count),
      storyboards: parseInt(storyboards.rows[0].count),
      scenes: parseInt(scenes.rows[0].count),
      media: parseInt(media.rows[0].count),
      transitions: parseInt(transitions.rows[0].count),
      audio: parseInt(audio.rows[0].count),
      styles: parseInt(styles.rows[0].count),
      renders: parseInt(renders.rows[0].count),
      exports: parseInt(exports.rows[0].count),
      prompts: parseInt(prompts.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/style-recommendation', require('./routes/styleRecommendation')); app.use('/api/music-generation', require('./routes/musicGeneration')); app.use('/api/voice-over-synthesis', require('./routes/voiceOverSynthesis')); app.use('/api/video-editing-suggestions', require('./routes/videoEditingSuggestions')); app.use('/api/viral-score-prediction', require('./routes/viralScorePrediction')); app.use('/api/collaboration-layer', require('./routes/collaborationLayer'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-style-recommendation', require('./routes/gapNoAiDrivenStyleRecommendation'));
app.use('/api/gap-no-music-sound-generation', require('./routes/gapNoMusicSoundGeneration'));
app.use('/api/gap-no-ai-voice-over-synthesis-endpoint', require('./routes/gapNoAiVoiceOverSynthesisEndpoint'));
app.use('/api/gap-limited-integration-with-stock-video-image-libraries-only', require('./routes/gapLimitedIntegrationWithStockVideoImageLibrariesOnly'));
app.use('/api/gap-no-collaboration-commenting-system', require('./routes/gapNoCollaborationCommentingSystem'));
app.use('/api/gap-no-approval-workflow-for-video-review', require('./routes/gapNoApprovalWorkflowForVideoReview'));
app.use('/api/gap-no-direct-publish-to-platform-integration-youtube-tiktok', require('./routes/gapNoDirectPublishToPlatformIntegrationYoutubeTiktok'));
app.use('/api/gap-no-webhooks-for-render-complete-events', require('./routes/gapNoWebhooksForRenderCompleteEvents'));
app.use('/api/gap-no-notifications-subsystem', require('./routes/gapNoNotificationsSubsystem'));

// Custom Views (mounted BEFORE 404 handler)
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

async function start(){try{const ready=await pool.query("SELECT to_regclass('public.media_workflows') AS workflow, to_regclass('public.media_workflow_audit') AS audit");if(!ready.rows[0].workflow||!ready.rows[0].audit)throw new Error('database migrations are pending; run npm run migrate');app.listen(PORT,()=>console.log(`AI Video Generation Backend running on port ${PORT}`));}catch(e){console.error('[startup] schema readiness failed:',e.message);process.exit(1);}}start();
