'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  if (!['true', '1'].includes(process.env.ALLOW_SCHEMA_MIGRATION || '')) throw new Error('ALLOW_SCHEMA_MIGRATION=true is required');
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = (process.env.PROVISION_ADMIN_NAME || '').trim();
  const tenant = (process.env.TENANT_ID || process.env.GOVERNANCE_TENANT_ID || '').trim();
  if (!email || !name || !tenant || password.length < 12) throw new Error('runtime administrator configuration is incomplete');
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'editor', tenant_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT');
  const migration = fs.readFileSync(path.resolve(__dirname, '../migrations/001_authoritative_media_workflow.sql'), 'utf8');
  await pool.query(migration);
  await pool.query(`CREATE TABLE IF NOT EXISTS media_ai_results (
    id BIGSERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), tenant_id TEXT NOT NULL,
    feature_type TEXT NOT NULL, input_data JSONB NOT NULL, result JSONB NOT NULL,
    model_used TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(email,password_hash,name,role,tenant_id) VALUES($1,$2,$3,'admin',$4)
     ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role='admin',tenant_id=EXCLUDED.tenant_id`,
    [email, hash, name, tenant]
  );
  console.log('Runtime schema and administrator are ready.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
