// Simple migration: copy Agent.phone -> Agent.mobile if mobile missing
const mongoose = require('mongoose');
require('dotenv').config();
const Agent = require('../models/Agent');

(async ()=>{
  if (!process.env.MONGO_URI) return console.error('MONGO_URI not set');
  await mongoose.connect(process.env.MONGO_URI);
  const agents = await Agent.find({}).lean();
  for (const a of agents) {
    if (!a.mobile && a.phone) {
      console.log('Migrating', a._id, a.email, 'phone->mobile', a.phone);
      await Agent.updateOne({ _id: a._id }, { $set: { mobile: a.phone }, $unset: { phone: '' } });
    }
  }
  console.log('Migration complete');
  process.exit(0);
})();
