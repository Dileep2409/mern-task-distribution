const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes (defined after DB connect in init)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Health endpoint to report DB connection state
app.get('/api/health', (req, res) => {
  try {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const state = states[mongoose.connection.readyState] || mongoose.connection.readyState;
    return res.json({ status: 'ok', mongooseState: state });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Development-only debug endpoints
if ((process.env.NODE_ENV || 'development') === 'development') {
  app.post('/api/debug/create-admin', express.json(), async (req, res) => {
    try {
      const { email, password, name } = req.body || {};
      if (!email || !password) return res.status(400).json({ message: 'email and password required' });
      const User = require('./models/User');
      const existing = await User.findOne({ email }).select('+password');
      if (existing) return res.status(200).json({ message: 'already_exists' });
      const admin = new User({ name: name || 'Admin', email, password, role: 'admin' });
      await admin.save();
      return res.status(201).json({ message: 'created', email });
    } catch (err) {
      console.error('debug create-admin error:', err.stack || err.message || err);
      return res.status(500).json({ message: 'error', error: err.message });
    }
  });
}

// Development-only debug endpoints
if (process.env.NODE_ENV === 'development') {
  try {
    const User = require('./models/User');
    app.get('/api/debug/users', async (req, res) => {
      try {
        const users = await User.find({}, '-password').lean();
        res.json({ count: users.length, users });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
  } catch (err) {
    console.warn('Could not mount /api/debug/users:', err.message);
  }
}

// Test
app.get('/', (req, res) => res.send('API running!'));

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message || err);
  const payload = { message: err.message || 'Server Error' };
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;
  res.status(err.status || 500).json(payload);
});

// Connect DB and start server with port-retry
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message || err);
    process.exit(1);
  }
};

const startServer = (port, attempt = 0, maxAttempts = 10) => {
  const server = app.listen(port, () => {
    console.log(`📡 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      if (attempt >= maxAttempts) {
        console.error(`❌ Port ${port} is in use and exceeded retry attempts. Exiting.`);
        process.exit(1);
      }
      const nextPort = port + 1;
      console.warn(`⚠️ Port ${port} in use, trying ${nextPort} (attempt ${attempt + 1}/${maxAttempts})...`);
      setTimeout(() => startServer(nextPort, attempt + 1, maxAttempts), 200);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

const init = async () => {
  await connectDB();
  // In development, ensure a default admin exists so login works out-of-the-box
  if ((process.env.NODE_ENV || 'development') === 'development') {
    try {
      const User = require('./models/User');
      const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
      const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';
  const existing = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
      if (!existing) {
        console.log('Dev seed: creating default admin', ADMIN_EMAIL);
        const admin = new User({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
        await admin.save();
        console.log('Dev seed: admin created');
      } else {
        console.log('Dev seed: admin already exists');
      }
    } catch (err) {
      console.warn('Dev seed: could not ensure admin exists:', err.message || err);
    }
    // Ensure at least 5 agents exist in development for task distribution testing
    try {
      const Agent = require('./models/Agent');
      const agents = await Agent.find({}).limit(10).lean();
      const needed = Math.max(0, 5 - agents.length);
      if (needed > 0) {
        console.log(`Dev seed: creating ${needed} dummy agents for testing`);
        for (let i = 0; i < needed; i++) {
          const n = agents.length + i + 1;
          const email = `devagent${n}@example.com`;
          const name = `Agent ${n}`;
          const mobile = `+91100000000${n}`;
          const a = new (require('./models/Agent'))({ name, email, mobile, password: '123456' });
          try { await a.save(); } catch (e) { /* ignore duplicates */ }
        }
      }
    } catch (err) {
      console.warn('Dev seed agents failed:', err.message || err);
    }
  }
  const initialPort = parseInt(process.env.PORT, 10) || 5000;
  startServer(initialPort);
};

// start
init();
