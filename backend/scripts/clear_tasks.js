require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const before = await Task.countDocuments();
    console.log('Tasks before:', before);
    const res = await Task.deleteMany({});
    console.log('Deleted:', res.deletedCount);
    const after = await Task.countDocuments();
    console.log('Tasks after:', after);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing tasks:', err.stack || err.message || err);
    process.exit(1);
  }
})();
