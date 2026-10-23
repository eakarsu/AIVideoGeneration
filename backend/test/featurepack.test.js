'use strict';
// Offline only: unset provider keys before importing the app module.
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const fp = require('../featurepack');

const rows = [
  { id: '1', name: 'Launch Promo', description: 'Product launch', status: 'draft', style: 'cinematic', aspect_ratio: '16:9', duration_seconds: 30, created_at: '2026-01-01' },
  { id: '2', name: 'Teaser', description: '', status: 'ready', style: '', aspect_ratio: '9:16', duration_seconds: 0, created_at: '2026-01-02' },
];

test('tasks validate, create, list-filter and update', () => {
  const store = fp.createTaskStore();
  assert.throws(() => store.create('t:u', { title: '' }), /required/);
  const saved = store.create('t:u', { title: ' Review render ', status: 'open', linkedId: '1' });
  assert.equal(store.update('t:u', saved.id, { status: 'done' }).status, 'done');
  assert.equal(store.list('t:u', { status: 'done' }).length, 1);
  assert.equal(store.list('t:other', {}).length, 0);
  assert.equal(store.update('t:u', 'missing', { title: 'x' }), null);
});

test('search/filter and CSV/JSON export preserve values', () => {
  assert.equal(fp.filterRecords(rows, { search: 'launch' }).length, 1);
  assert.equal(fp.filterRecords(rows, { status: 'ready' }).length, 1);
  assert.match(fp.recordsToCsv(rows), /Launch Promo/);
  const json = fp.recordsToJson(rows);
  assert.equal(json.count, 2); assert.equal(json.data[1].description, '');
  assert.equal(json.data[1].duration_seconds, 0);
});

test('AI insights are domain-grounded and fallback-labelled without a key', async () => {
  const fallback = fp.buildInsights(rows);
  assert.equal(fallback.projectPipeline.totalProjects, 2);
  assert.equal(fallback.styleCoverage.projectsMissingStyle, 1);
  assert.equal(fallback.productionReadiness.projectsWithZeroDuration, 1);
  assert.equal(fallback.productionReadiness.hasReadyProjects, true);
  const result = await fp.runAiInsights({ fallback, system: 's', user: 'u', env: {}, fetchFn: async () => { throw new Error('must not be called'); } });
  assert.equal(result.aiGenerated, false);
  assert.match(result.note, /Deterministic fallback/);
  assert.deepEqual(fp.aiSections({ zero: 0, flag: false, empty: '' }).map((s) => s.lines[0]), ['0', 'false', '(empty)']);
});

test('authenticated router: tasks, records search/export, AI insights', async () => {
  const app = express(); app.use(express.json());
  app.use((req, res, next) => req.headers.authorization === 'Bearer [REDACTED]' ? (req.user = { id: 'u', tenantId: 't' }, next()) : res.status(401).json({ error: 'unauthorized' }));
  app.use('/api/featurepack', fp.createFeaturePackRouter({ listRecords: async () => rows, env: {} }));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}/api/featurepack`;
  try {
    assert.equal((await fetch(`${base}/tasks`)).status, 401);
    const h = { authorization: 'Bearer [REDACTED]', 'content-type': 'application/json' };
    const created = await (await fetch(`${base}/tasks`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Approve cut' }) })).json();
    assert.equal(created.status, 'open');
    assert.equal((await (await fetch(`${base}/tasks/${created.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ status: 'done' }) })).json()).status, 'done');
    assert.equal((await (await fetch(`${base}/records?search=launch`, { headers: h })).json()).data.length, 1);
    assert.match(await (await fetch(`${base}/records/export?format=csv`, { headers: h })).text(), /Launch Promo/);
    assert.equal((await (await fetch(`${base}/records/export?format=json`, { headers: h })).json()).count, 2);
    const ai = await (await fetch(`${base}/ai/insights`, { method: 'POST', headers: h, body: JSON.stringify({}) })).json();
    assert.equal(ai.aiGenerated, false); assert.ok(ai.sections.length >= 3);
  } finally { server.close(); }
});
