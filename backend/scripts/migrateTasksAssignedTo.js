// Simple migration: copy 'assignedTo' -> 'agent' for Task documents (run once)
const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('../models/Task');

async function migrate() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const tasks = await Task.find({});
  let updated = 0;
  for (const t of tasks) {
    if (t.assignedTo && !t.agent) {
      t.agent = t.assignedTo;
      await t.save();
      updated++;
    }
  }
  console.log(`Migrated ${updated} tasks`);
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });