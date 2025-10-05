require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const EMAIL = 'dilleep@gmail.com';
const PASSWORD = '123456';
const NAME = 'Dilleep';

(async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');
    console.log('Connecting to', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    const lookup = EMAIL.trim().toLowerCase();
    let user = await User.findOne({ email: lookup }).select('+password');
    if (user) {
      console.log('User already exists:', user.email, 'id:', user._id.toString());
      process.exit(0);
    }
    user = new User({ name: NAME, email: lookup, password: PASSWORD, role: 'admin' });
    const saved = await user.save();
    console.log('Created user:', saved.email, 'id:', saved._id.toString());
    process.exit(0);
  } catch (err) {
    console.error('Error in create_admin_direct:', err.stack || err.message || err);
    process.exit(1);
  }
})();
