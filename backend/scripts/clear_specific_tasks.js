require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

// List of tasks to remove (firstName, phone, notes)
const toRemove = [
  { firstName: 'Anita', phone: '9988776655', notes: 'Send documents' },
  { firstName: 'Ankit', phone: '9123409876', notes: 'Request demo' },
  { firstName: 'Neha', phone: '9876512345', notes: 'Asked for quotation' },
  { firstName: 'Vikram', phone: '9988123456', notes: 'Pending documents' },
  { firstName: 'Riya', phone: '9123498765', notes: 'Schedule meeting' },
  { firstName: 'Sanjay', phone: '9876540987', notes: 'Call back next week' },
  { firstName: 'Anjali', phone: '9988771234', notes: 'Requires discount' }
];

function normalizePhone(p) {
  if (!p) return '';
  return p.replace(/[^0-9]/g, '');
}

(async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  let totalDeleted = 0;
  for (const item of toRemove) {
    // Build a case-insensitive regex for firstName and notes, and normalize phone digits
    const fnRegex = new RegExp(`^${item.firstName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
    const notesRegex = item.notes ? new RegExp(item.notes.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') : null;
    const phoneDigits = normalizePhone(item.phone);

    // Query: match firstName (case-insensitive) AND phone contains digits OR notes matches
    const query = {
      firstName: fnRegex,
      phone: { $regex: phoneDigits }
    };
    if (notesRegex) query.notes = notesRegex;

    const res = await Task.deleteMany(query);
    console.log(`Removed ${res.deletedCount} tasks matching: ${item.firstName} — ${item.phone} — ${item.notes}`);
    totalDeleted += res.deletedCount || 0;
  }

  console.log('Total deleted:', totalDeleted);
  process.exit(0);
})();
