// backend/controllers/agentController.js
// Agent Management ka logic (Create, Read)

const Agent = require('../models/Agent');
const User = require('../models/User'); // Zaroorat padne par Admin checks ke liye

// @desc    Naye Agent ko database mein add karein
// @route   POST /api/agents
// @access  Private (Admin only)
const createAgent = async (req, res, next) => {
    const { name, email, mobile, password } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;

    // Basic Validation
    if (!name || !email || !mobile || !password) {
        return res.status(400).json({ message: 'Please fill all required fields: Name, Email, Mobile, and Password.' });
    }

    try {
        // 1. Check karein ki email pehle se exist karta hai ya nahi (Agent ya User dono mein)
    const agentExists = await Agent.findOne({ email: normalizedEmail });
    const adminExists = await User.findOne({ email: normalizedEmail });

        if (agentExists || adminExists) {
            return res.status(400).json({ message: 'A user or agent with this email already exists.' });
        }

        // Validate mobile format (basic): starts with + and country code and digits, or starts with digits
        const mobileRegex = /^(\+\d{1,3})?\d{7,15}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: 'Invalid mobile number format. Include country code, e.g. +919876543210' });
        }

        // 2. Naya Agent banaayein
        // Password hashing automatically Agent model ke pre('save') hook se ho jayega
        const agent = await Agent.create({
            name,
            email: normalizedEmail,
            mobile,
            password,
        });

        if (agent) {
            // Success response (security ke liye password hash nahi bhejenge)
            return res.status(201).json({
                message: 'Agent created successfully!',
                _id: agent._id,
                name: agent.name,
                email: agent.email,
                mobile: agent.mobile,
            });
        } else {
            return res.status(400).json({ message: 'Invalid agent data received.' });
        }

    } catch (error) {
        // Error handling for database issues
        console.error('createAgent error:', error.stack || error.message || error);
        // Handle Mongo duplicate key error
        if (error && error.code === 11000) {
            return res.status(400).json({ message: 'An agent with this email already exists.' });
        }
        const payload = { message: 'Server error while creating agent' };
        if (process.env.NODE_ENV === 'development') payload.error = error.message;
        return res.status(500).json(payload);
    }
};

// @desc    Sabhi Agents ki list dekhein
// @route   GET /api/agents
// @access  Private (Admin only)
const getAgents = async (req, res, next) => {
    try {
        // Sabhi agents ko fetch karein, password ko exclude karke
        const agents = await Agent.find({}).select('-password');

        return res.status(200).json(agents);
    } catch (error) {
        console.error('getAgents error:', error.message || error);
        return res.status(500).json({ message: 'Server error while fetching agents' });
    }
};

module.exports = {
    createAgent,
    getAgents,
};
