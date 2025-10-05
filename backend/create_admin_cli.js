#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.argv[2];
const password = process.argv[3] || '123456';
const name = process.argv[4] || 'Admin';

(async () => {
  if (!email) {
    console.error('Usage: node create_admin_cli.js <email> [password] [name]');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const lookup = email.trim().toLowerCase();
    const existing = await User.findOne({ email: lookup }).select('+password');
    if (existing) {
      console.log('User already exists:', existing.email);
      process.exit(0);
    }

    const u = new User({ name, email: lookup, password, role: 'admin' });
    const saved = await u.save();
    console.log('Created admin:', saved.email, 'id:', saved._id.toString());
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.stack || err.message || err);
    process.exit(1);
  }
})();
