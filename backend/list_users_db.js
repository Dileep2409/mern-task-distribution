require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async ()=>{
  if (!process.env.MONGO_URI) return console.error('MONGO_URI not set');
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}, '-password').lean();
  console.log('Users:', users);
  process.exit(0);
})();
