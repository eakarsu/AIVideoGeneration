'use strict';

async function requestConceptAdvice(input) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
  if (!apiKey || !model || !baseUrl) throw new Error('OpenRouter configuration is required');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'AI Video Generation' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a video creative director. Return valid JSON with conceptSummary, scenePlan, visualRisks, and nextActions.' },
        { role: 'user', content: JSON.stringify(input) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4
    })
  });
  if (!response.ok) throw new Error(`OpenRouter request failed with HTTP ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content');
  let result;
  try { result = JSON.parse(content); } catch { result = { conceptSummary: content }; }
  return { result, model: data.model || model, usage: data.usage || null };
}

module.exports = { requestConceptAdvice };
