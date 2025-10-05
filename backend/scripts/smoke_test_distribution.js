require('dotenv').config();
const fs = require('fs');
const fetch = global.fetch || require('node-fetch');
const FormData = require('form-data');

const BASE = process.env.TEST_BASE || `http://localhost:${process.env.PORT || 5000}`;

(async () => {
  try {
    console.log('Using base URL:', BASE);

    // Login as admin (dev defaults)
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: '123456' })
    });
    const loginBody = await loginRes.json().catch(() => null);
    if (!loginRes.ok || !loginBody?.token) {
      console.error('Login failed:', loginRes.status, loginBody);
      process.exit(1);
    }
    const token = loginBody.token;
    console.log('Login succeeded, token length:', token.length);

    // Upload sample CSV
    const form = new FormData();
    // Prefer a sample CSV in the repository root (relative path). You can also set TEST_SAMPLE env var.
    const samplePath = process.env.TEST_SAMPLE || require('path').join(__dirname, '..', '..', 'sample-tasks.csv');
    if (!fs.existsSync(samplePath)) {
      console.error('Sample CSV not found at', samplePath);
      process.exit(1);
    }
    form.append('file', fs.createReadStream(samplePath));

    const uploadRes = await fetch(`${BASE}/api/tasks/upload`, {
      method: 'POST',
      headers: Object.assign({ Authorization: `Bearer ${token}` }, form.getHeaders ? form.getHeaders() : {}),
      body: form
    });
    const uploadText = await uploadRes.text();
    console.log('Upload status:', uploadRes.status, 'body:', uploadText);

    // Fetch distributed
    const distRes = await fetch(`${BASE}/api/tasks/distributed`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const distJson = await distRes.json().catch(() => null);
    console.log('Distributed status:', distRes.status);
    if (!Array.isArray(distJson)) {
      console.log('Distributed response:', distJson);
      process.exit(0);
    }

    // Print counts per agent
    distJson.forEach((g, idx) => {
      const name = g.agent ? `${g.agent.name} <${g.agent.email}>` : 'Unassigned';
      console.log(`Agent ${idx + 1}: ${name} -> ${Array.isArray(g.tasks) ? g.tasks.length : 0} tasks`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err.stack || err.message || err);
    process.exit(1);
  }
})();
