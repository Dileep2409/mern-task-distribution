const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    firstName: String,
    phone: String,
    notes: String,
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' }
});

module.exports = mongoose.model('Task', taskSchema);
