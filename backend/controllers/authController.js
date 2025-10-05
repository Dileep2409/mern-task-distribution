const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Helper to generate JWT
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    const err = new Error('JWT_SECRET is not set in environment. Set JWT_SECRET in backend/.env');
    err.status = 500;
    throw err;
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/login
// Public
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  try {
  const lookupEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
  console.log('loginAdmin called for:', lookupEmail);
  console.log('Mongoose connection state:', require('mongoose').connection.readyState);
  // include password explicitly
  const user = await User.findOne({ email: lookupEmail }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid Credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid Credentials.' });

    const role = user.role || 'admin';
    const token = generateToken(user._id, role);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role,
      token,
      message: 'Login Successful'
    });
  } catch (err) {
    console.error('loginAdmin error:', err.stack || err.message || err);
    const payload = { message: 'Server error' };
    if (process.env.NODE_ENV === 'development') {
      payload.error = err.message;
      payload.stack = err.stack;
    }
    return res.status(500).json(payload);
  }
};

module.exports = { loginAdmin };
