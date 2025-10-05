const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Read admin creds from env or CLI args
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.argv[3] || '123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

const createAdmin = async () => {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI is not set in .env. Aborting.');
        process.exit(1);
    }

    console.log('Connecting to MongoDB at', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Checking for existing admin:', ADMIN_EMAIL);

    try {
        const existing = await User.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log(`Admin with email ${ADMIN_EMAIL} already exists. Skipping creation.`);
            process.exit(0);
        }

        // Create user with plain password; User model pre-save will hash it
        const admin = new User({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
        const saved = await admin.save();
        console.log('✅ Admin created:', saved.email, 'id:', saved._id);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating admin:', err.stack || err.message || err);
        process.exit(1);
    }
};

createAdmin();
