// Node 18+ has global fetch
(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: '123456' }),
    });
    console.log('Status:', res.status);
    const text = await res.text();
    try {
      console.log('Body (json):', JSON.parse(text));
    } catch (e) {
      console.log('Body (text):', text);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
})();
