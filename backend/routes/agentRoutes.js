const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createAgent, getAgents } = require('../controllers/agentController');

// Add agent (admin only)
router.post('/', protect(['admin']), createAgent);

// Get all agents (admin only)
router.get('/', protect(['admin']), getAgents);

module.exports = router;
