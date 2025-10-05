const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadAndDistribute, getDistributed } = require('../controllers/taskController');
const Task = require('../models/Task');

router.post('/upload', protect(['admin']), uploadAndDistribute);
router.get('/distributed', protect(['admin']), getDistributed);
router.get('/', protect(['admin']), async (req, res, next) => {
    try {
        const tasks = await Task.find().populate('agent', 'name email mobile');
        res.json(tasks);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
