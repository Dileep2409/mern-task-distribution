const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}, '-password').lean();
  console.log('Users in DB:', users);

  // Test login endpoint
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: '123456' }),
    });
    console.log('Login status:', res.status);
    const text = await res.text();
    try {
      console.log('Login body:', JSON.parse(text));
    } catch (e) {
      console.log('Login body (raw):', text);
    }
  } catch (err) {
    console.error('Error calling login endpoint:', err);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
