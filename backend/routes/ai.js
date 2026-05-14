const express = require('express');
const axios = require('axios');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// AI Chat for video generation assistance
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversation_id } = req.body;

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert AI video generation assistant. Help users create stunning videos by providing creative prompts, storyboard ideas, scene descriptions, camera movements, lighting suggestions, and video editing advice. You specialize in text-to-video generation, image animation, cinematic techniques, and video post-production workflows.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Video Generation Platform',
        }
      }
    );

    const aiResponse = response.data;
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || 'No response generated';

    // Save conversation
    let convId = conversation_id;
    if (!convId) {
      const convResult = await pool.query(
        'INSERT INTO conversations (title, model, status) VALUES ($1, $2, $3) RETURNING id',
        [message.substring(0, 100), process.env.OPENROUTER_MODEL, 'active']
      );
      convId = convResult.rows[0].id;
    }

    await pool.query('INSERT INTO conversation_messages (conversation_id, role, content) VALUES ($1, $2, $3)', [convId, 'user', message]);
    await pool.query('INSERT INTO conversation_messages (conversation_id, role, content) VALUES ($1, $2, $3)', [convId, 'assistant', assistantMessage]);

    res.json({
      conversation_id: convId,
      message: assistantMessage,
      model: aiResponse.model,
      usage: aiResponse.usage,
      raw_response: aiResponse,
    });
  } catch (err) {
    console.error('AI Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Generate video prompt from description
router.post('/generate-prompt', auth, async (req, res) => {
  try {
    const { description, style, duration, mood } = req.body;

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert at creating detailed video generation prompts. Given a description, create a highly detailed, specific prompt that will produce stunning AI-generated video. Include camera movements, lighting, atmosphere, colors, and motion details. Also provide a negative prompt to avoid unwanted elements.' },
          { role: 'user', content: `Create a detailed video generation prompt for:\nDescription: ${description}\nStyle: ${style || 'cinematic'}\nDuration: ${duration || '4 seconds'}\nMood: ${mood || 'dramatic'}\n\nProvide:\n1. Main prompt (detailed, specific)\n2. Negative prompt\n3. Recommended camera motion\n4. Lighting suggestions\n5. Color palette` }
        ],
        temperature: 0.8,
        max_tokens: 2048,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Video Generation Platform',
        }
      }
    );

    res.json({
      result: response.data.choices?.[0]?.message?.content,
      model: response.data.model,
      usage: response.data.usage,
      raw_response: response.data,
    });
  } catch (err) {
    console.error('Prompt Gen Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Generate storyboard from concept
router.post('/generate-storyboard', auth, async (req, res) => {
  try {
    const { concept, num_scenes, style, duration } = req.body;

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a professional storyboard artist and video director. Create detailed storyboards with scene descriptions, camera angles, transitions, and timing. Output in a clear, structured format.' },
          { role: 'user', content: `Create a ${num_scenes || 5}-scene storyboard for:\nConcept: ${concept}\nStyle: ${style || 'cinematic'}\nTotal Duration: ${duration || '30 seconds'}\n\nFor each scene provide:\n1. Scene title\n2. Duration\n3. Visual description\n4. Camera movement\n5. Transition to next scene\n6. Audio/music notes\n7. AI generation prompt for the scene` }
        ],
        temperature: 0.8,
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Video Generation Platform',
        }
      }
    );

    res.json({
      storyboard: response.data.choices?.[0]?.message?.content,
      model: response.data.model,
      usage: response.data.usage,
      raw_response: response.data,
    });
  } catch (err) {
    console.error('Storyboard Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Analyze and improve video prompt
router.post('/analyze-prompt', auth, async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert at analyzing and improving AI video generation prompts. Evaluate the given prompt for clarity, specificity, and effectiveness. Provide an improved version with explanations.' },
          { role: 'user', content: `Analyze and improve this video generation prompt:\n\n"${prompt}"\n\nProvide:\n1. Score (1-10) for the original prompt\n2. Issues found\n3. Improved prompt\n4. Why the improved version is better\n5. Additional negative prompt suggestions` }
        ],
        temperature: 0.5,
        max_tokens: 2048,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Video Generation Platform',
        }
      }
    );

    res.json({
      analysis: response.data.choices?.[0]?.message?.content,
      model: response.data.model,
      usage: response.data.usage,
      raw_response: response.data,
    });
  } catch (err) {
    console.error('Analysis Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Generate scene description
router.post('/generate-scene', auth, async (req, res) => {
  try {
    const { scene_concept, style, camera_motion, mood } = req.body;

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a cinematographer and AI video director. Create detailed scene descriptions optimized for AI video generation. Focus on visual details, motion, lighting, and atmosphere.' },
          { role: 'user', content: `Create a detailed scene description for AI video generation:\nScene: ${scene_concept}\nStyle: ${style || 'cinematic'}\nCamera: ${camera_motion || 'slow pan'}\nMood: ${mood || 'dramatic'}\n\nProvide:\n1. Detailed visual description\n2. Exact camera movement and speed\n3. Lighting setup\n4. Color grading notes\n5. Motion/animation details\n6. Background elements\n7. Optimized AI prompt` }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Video Generation Platform',
        }
      }
    );

    res.json({
      scene: response.data.choices?.[0]?.message?.content,
      model: response.data.model,
      usage: response.data.usage,
      raw_response: response.data,
    });
  } catch (err) {
    console.error('Scene Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Style recommendation engine
router.post('/style-recommend', auth, async (req, res) => {
  try {
    const { brand, industry, target_audience, content_type, mood } = req.body;
    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an art director recommending visual styles for AI-generated video. Always respond with valid JSON.' },
          { role: 'user', content: `Recommend visual styles for this project:\nBrand: ${brand || 'unknown'}\nIndustry: ${industry || 'unknown'}\nTarget audience: ${target_audience || 'general'}\nContent type: ${content_type || 'social'}\nMood: ${mood || 'unspecified'}\n\nReturn JSON: { "recommendations": [{ "styleName": "", "description": "", "colorPalette": ["#hex", "#hex"], "lighting": "", "cameraStyle": "", "promptKeywords": ["..."] }], "summary": "" }` }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Video Generation Platform',
        }
      }
    );
    const content = response.data.choices?.[0]?.message?.content;
    let parsed = null;
    try { parsed = JSON.parse(content); } catch (_) {}
    res.json({ recommendations: parsed, raw: content, model: response.data.model, usage: response.data.usage });
  } catch (err) {
    console.error('Style Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Viral score prediction
router.post('/viral-score', auth, async (req, res) => {
  try {
    const { title, hook, description, platform, length_seconds, content_type } = req.body;
    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a social-media analyst predicting video virality. Always respond with valid JSON.' },
          { role: 'user', content: `Score the viral potential of this video concept on ${platform || 'short-form video platforms'}:\nTitle: ${title || ''}\nHook: ${hook || ''}\nDescription: ${description || ''}\nLength: ${length_seconds || 'unknown'}s\nContent type: ${content_type || 'unknown'}\n\nReturn JSON: { "viralScore": 0, "scoreLabel": "low|medium|high", "strengths": ["..."], "weaknesses": ["..."], "improvements": ["..."], "platformFit": { "tiktok": 0, "instagram": 0, "youtube": 0 } }` }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Video Generation Platform',
        }
      }
    );
    const content = response.data.choices?.[0]?.message?.content;
    let parsed = null;
    try { parsed = JSON.parse(content); } catch (_) {}
    res.json({ score: parsed, raw: content, model: response.data.model, usage: response.data.usage });
  } catch (err) {
    console.error('Viral Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// Conversations
router.get('/conversations', auth, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM conversations ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const conv = await pool.query('SELECT * FROM conversations WHERE id = $1', [req.params.id]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const messages = await pool.query('SELECT * FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ ...conv.rows[0], messages: messages.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM conversation_messages WHERE conversation_id = $1', [req.params.id]);
    const r = await pool.query('DELETE FROM conversations WHERE id = $1 RETURNING *', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
