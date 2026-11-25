// backend/test/cors_and_auth.test.js
// Tests for CORS origin handling, preflight, and auth endpoints.
//
// Notes:
// - allowedOrigins is computed at module-load time from process.env.CLIENT_URL,
//   so CLIENT_URL must be set before requiring the server module.
// - The auth architecture uses JWT in localStorage + Authorization: Bearer
//   headers (no cookies, no CSRF tokens, no SameSite/Secure cookie settings).

process.env.CLIENT_URL = 'https://convo-x-nine.vercel.app';
process.env.PORT = '0'; // random free port, avoid conflicts
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';

// Clean up test database from previous runs so registration tests are deterministic
const fs = require('fs');
const path = require('path');
const testDbPath = path.join(__dirname, '../data/convo.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

let appRef, serverRef, dbReadyRef;

test('setup: load server after env vars set', async () => {
  const mod = require('../server');
  appRef = mod.app;
  serverRef = mod.server;
  dbReadyRef = mod.dbReady;
  await dbReadyRef;
});

test('CORS: trusted origin gets CORS header on OPTIONS preflight', async () => {
  const res = await request(appRef)
    .options('/api/auth/login')
    .set('Origin', 'https://convo-x-nine.vercel.app')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
  assert.strictEqual(res.status, 204);
  assert.strictEqual(
    res.headers['access-control-allow-origin'],
    'https://convo-x-nine.vercel.app'
  );
  assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
});

test('CORS: untrusted origin is rejected (no CORS header)', async () => {
  const res = await request(appRef)
    .options('/api/auth/login')
    .set('Origin', 'https://evil.com')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
  // No Access-Control-Allow-Origin header = browser blocks the request
  assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
});

test('CORS: health endpoint responds without origin header requirement', async () => {
  const res = await request(appRef).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('Auth: register a new user', async () => {
  const res = await request(appRef)
    .post('/api/auth/register')
    .set('Origin', 'https://convo-x-nine.vercel.app')
    .send({ username: 'testuser1', email: 'testuser1@example.com', password: 'password123' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.message, 'User registered successfully');
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.username, 'testuser1');
});

test('Auth: register duplicate user fails', async () => {
  const res = await request(appRef)
    .post('/api/auth/register')
    .set('Origin', 'https://convo-x-nine.vercel.app')
    .send({ username: 'testuser1', email: 'testuser1@example.com', password: 'password123' });
  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error.includes('already exists'));
});

test('Auth: login with valid credentials', async () => {
  const res = await request(appRef)
    .post('/api/auth/login')
    .set('Origin', 'https://convo-x-nine.vercel.app')
    .send({ username: 'testuser1', password: 'password123' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.message, 'Login successful');
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.username, 'testuser1');
  return res.body.token;
});

test('Auth: login with invalid credentials fails', async () => {
  const res = await request(appRef)
    .post('/api/auth/login')
    .set('Origin', 'https://convo-x-nine.vercel.app')
    .send({ username: 'testuser1', password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, 'Invalid credentials');
});

test('Auth: authenticated API request with valid token', async () => {
  // First login to get a token
  const loginRes = await request(appRef)
    .post('/api/auth/login')
    .set('Origin', 'https://convo-x-nine.vercel.app')
    .send({ username: 'testuser1', password: 'password123' });
  const token = loginRes.body.token;

  // Use token to access protected endpoint
  const res = await request(appRef)
    .get('/api/users')
    .set('Origin', 'https://convo-x-nine.vercel.app')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.users);
  assert.ok(Array.isArray(res.body.users));
});

test('Auth: authenticated API request without token fails', async () => {
  const res = await request(appRef)
    .get('/api/users')
    .set('Origin', 'https://convo-x-nine.vercel.app');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, 'Authentication required');
  serverRef.close();
  process.exit(0);
});
