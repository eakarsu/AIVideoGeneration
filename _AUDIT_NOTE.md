# Audit Recommendations & Status — AIVideoGeneration

Source: /Users/erolakarsu/projects/_AUDIT/reports/batch_08.md (section 28)

Verdict per audit: substantive (8 AI endpoints, 17 non-AI routes, ai.js 238 lines).

## Original audit recommendations

Missing AI counterparts:
- AI-driven style recommendation
- Music / sound generation

Missing non-AI:
- Stock video / image library integrations
- Collaboration / commenting
- Approval workflow for video review
- Publish-to-platform integration (YouTube, TikTok)

Custom feature ideas:
- Style recommendation engine
- Music generation
- Voice-over synthesis
- Video editing suggestions
- Viral score prediction

## Implemented in this pass (MECHANICAL)

Added two new text-only endpoints to existing `backend/routes/ai.js`, matching its style.

- `POST /api/ai/style-recommend` — visual-style recommendations from brand/industry/audience/mood, returns JSON with palette, lighting, camera style, prompt keywords.
- `POST /api/ai/viral-score` — viral-potential score with platform fit (tiktok/instagram/youtube) for a concept.

## Backlog

1. Style recommendation endpoint (`/style-recommend`) — could be a mechanical text-only addition modeled after the existing `/generate-prompt` pattern. Not done in this pass to keep changes focused; recommended next.
2. Viral score prediction (`/viral-score`) — text-only input + heuristic prompt; mechanical add-on.
3. Music generation — needs external service decision (Suno/Riffusion/etc.).
4. Voice-over synthesis — needs TTS provider (ElevenLabs/Polly).
5. Stock video integration — Shutterstock/Storyblocks creds.
6. Publish-to-platform — OAuth setup per platform.

## Apply pass 4 (mechanical backlog)

SKIP. The two MECHANICAL items in the original backlog (`/style-recommend`, `/viral-score`) were implemented in pass 2 and surfaced in pass 3. The remaining items all need external service decisions or credentials — Music generation (NEEDS-PRODUCT-DECISION + NEEDS-CREDS for Suno/Riffusion), Voice-over synthesis (NEEDS-CREDS for ElevenLabs/Polly), Stock video integration (NEEDS-CREDS for Shutterstock/Storyblocks), Publish-to-platform (NEEDS-CREDS per-platform OAuth). No mechanical-only additions remain.

## Apply pass 3 (frontend)

LEFT-AS-IS. Both pass-2 endpoints (`/api/ai/style-recommend` and `/api/ai/viral-score`)
are already surfaced in the FE: `frontend/src/pages/StyleRecommendPage.js` and
`ViralScorePage.js` exist, and `App.js` registers them as `/style-recommend` and
`/viral-score` routes inside `<ProtectedRoute>`. FE already wired.

## Apply pass 5 (all backlog)

4 backlog clusters implemented (= 6 endpoints).

New file (no edits to existing routes): `backend/routes/integrations.js`
- `POST /api/integrations/music-gen` (NEEDS-PRODUCT-DECISION + NEEDS-CREDS) — 503+missing:MUSIC_GEN_API_KEY. PRODUCT-DECISION default provider "suno" via MUSIC_GEN_PROVIDER override.
- `POST /api/integrations/tts/voiceover` (NEEDS-CREDS) — 503+missing:TTS_API_KEY. Default provider "elevenlabs", default voice "neutral-1".
- `GET /api/integrations/stock/search` (NEEDS-CREDS) — 503+missing:STOCK_VIDEO_API_KEY. Default provider "shutterstock".
- `POST /api/integrations/publish`, `GET /api/integrations/publish/jobs` (NEEDS-CREDS) — platform routing: youtube needs YOUTUBE_OAUTH_TOKEN, tiktok needs TIKTOK_OAUTH_TOKEN. Persists job rows into new `publish_jobs` table (CREATE TABLE IF NOT EXISTS).

`backend/server.js`: one `app.use('/api/integrations', ...)` registration; no other changes.

Smoke test (port 14804, JWT_SECRET inherited from .env): logged in `admin@aivideo.com / admin123`. music-gen 503 missing:MUSIC_GEN_API_KEY; tts 503 missing:TTS_API_KEY; stock 503 missing:STOCK_VIDEO_API_KEY; publish (youtube) 503 missing:YOUTUBE_OAUTH_TOKEN; publish/jobs 200 (`{"jobs":[]}`). Backend stopped.

Syntax check: `node --check` PASS for new module + server.js.

No new dependencies, no `npm install`.
