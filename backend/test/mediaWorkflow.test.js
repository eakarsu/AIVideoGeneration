const test = require('node:test'); const assert = require('node:assert/strict'); const p = require('../domain/mediaWorkflow');
test('rights are mandatory', () => assert.throws(() => p.validateAsset({ uri: 'x' }), /rights/));
test('asset consent is explicit', () => assert.equal(p.validateAsset({ uri: 'x', rightsBasis: 'owned', consentStatus: 'granted' }), true));
test('render is version pinned', () => assert.throws(() => p.transition({ status: 'editing', version: 1 }, 'render_queued'), /pinned/));
test('creator cannot approve', () => assert.throws(() => p.transition({ status: 'review', version: 1, creatorId: 'u' }, 'approved', { reviewerId: 'u',moderationStatus:'passed',disclosureConfirmed:true }), /independent/));
test('golden export hash is evaluated', () => assert.equal(p.validateEvaluation({ quality: 1, timing: 1, layout: 1, accessibility: 1, brand: 1, multilingual: 1, deterministicHash: 'sha256:x' }), true));
test('publish can dead-letter safely', () => assert.equal(p.acceptReceipt({ provider: 'youtube', idempotencyKey: 'k', status: 'dead_letter' }), true));
test('tenant scope matches',()=>assert.equal(p.assertScope({tenantId:'t'},{tenantId:'t'}),true));
test('cross-tenant media is hidden',()=>assert.throws(()=>p.assertScope({tenantId:'t'},{tenantId:'x'}),/tenant/));
