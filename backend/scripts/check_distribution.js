// Check distribution among first 5 agents and print counts and samples
require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const Task = require('../models/Task');

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const agents = await Agent.find({}).sort({ _id: 1 }).limit(5).lean();
  if (agents.length < 5) {
    console.warn('Less than 5 agents found. Found:', agents.length);
  }
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const count = await Task.countDocuments({ agent: a._id });
    console.log(`Agent ${i+1}: ${a.name} <${a.email}> mobile=${a.mobile||a.phone||''} -> tasks=${count}`);
    const tasks = await Task.find({ agent: a._id }).limit(10).lean();
    tasks.forEach(t => console.log('  -', t.firstName, t.phone, t.notes));
  }
  const unassigned = await Task.countDocuments({ agent: { $exists: false } });
  console.log('Unassigned tasks count:', unassigned);
  process.exit(0);
})();
