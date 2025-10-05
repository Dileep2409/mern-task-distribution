require('dotenv').config();
const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const url = 'http://localhost:5000/api/debug/create-admin';
    const createRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dilleep@gmail.com', password: '123456', name: 'Dilleep' }),
    });
    console.log('Create status:', createRes.status);
    console.log('Create body:', await createRes.text());

    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dilleep@gmail.com', password: '123456' }),
    });
    console.log('Login status:', loginRes.status);
    const loginText = await loginRes.text();
    try {
      console.log('Login body:', JSON.parse(loginText));
    } catch (e) {
      console.log('Login raw body:', loginText);
    }
  } catch (err) {
    console.error('Debug create/login error:', err);
  }
})();
