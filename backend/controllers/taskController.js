const Agent = require('../models/Agent');
const Task = require('../models/Task');
const csv = require('csv-parser');
const multer = require('multer');
const { Readable } = require('stream');
const xlsx = require('xlsx');

// Multer setup
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        // also allow based on extension for some clients
        const name = (file.originalname || '').toLowerCase();
        const extOk = name.endsWith('.csv') || name.endsWith('.xls') || name.endsWith('.xlsx');
        if (allowedTypes.includes(file.mimetype) || extOk) cb(null, true);
        else cb(new Error('Invalid file type. Only CSV/XLS/XLSX allowed.'));
    }
}).single('file');

// Upload & distribute tasks
const uploadAndDistribute = async (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

        try {
            const agents = await Agent.find({}).sort({ _id: 1 });
            // Require at least 5 agents to match the assignment requirement
            if (!agents || agents.length < 5) return res.status(400).json({ message: 'At least 5 agents are required to distribute tasks. Please add more agents.' });

            let tasks = [];

            const name = (req.file.originalname || '').toLowerCase();
            if (req.file.mimetype === 'text/csv' || name.endsWith('.csv')) {
                // Handle BOM and ensure UTF-8 string
                let text = req.file.buffer.toString('utf8');
                // Strip BOM if present
                if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

                const readableStream = Readable.from([text]);
                readableStream.pipe(csv({ mapHeaders: ({ header }) => header && header.trim() }))
                    .on('data', (data) => tasks.push(data))
                    .on('end', async () => {
                        await processTasks(tasks, agents, res);
                    })
                    .on('error', (error) => {
                        console.error('CSV parse error:', error);
                        res.status(400).json({ message: 'CSV parsing error.' });
                    });
            } else {
                // xls/xlsx
                const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                tasks = xlsx.utils.sheet_to_json(worksheet);
                await processTasks(tasks, agents, res);
            }
        } catch (error) {
            console.error('uploadAndDistribute error:', error);
            res.status(500).json({ message: 'Server error while uploading tasks.' });
        }
    });
};

// Helper to save tasks
async function processTasks(tasks, agents, res) {
    if (!tasks || tasks.length === 0) return res.status(400).json({ message: 'Uploaded file empty.' });
    // Validate required columns exist on first row
    // Normalize keys to lower-case for consistent access
    const normalizeRow = (r) => {
        const out = {};
        Object.keys(r || {}).forEach(k => {
            const val = typeof r[k] === 'string' ? r[k].trim() : r[k];
            out[k.trim().toLowerCase()] = val;
        });
        return out;
    };

    const sample = normalizeRow(tasks[0] || {});
    const hasFirstName = Object.keys(sample).some(k => k === 'firstname' || k === 'name');
    const hasPhone = Object.keys(sample).some(k => k === 'phone' || k === 'mobile');
    if (!hasFirstName || !hasPhone) {
        return res.status(400).json({ message: 'Uploaded file must include FirstName and Phone (columns).' });
    }

    // Use exactly 5 agents (assignment requirement)
    const AGENTS_TO_USE = 5;
    const agentsToUse = agents.slice(0, AGENTS_TO_USE);

    const total = tasks.length;
    const base = Math.floor(total / AGENTS_TO_USE);
    let remainder = total % AGENTS_TO_USE;

    const distributedTasks = [];
    let taskIndex = 0;
    for (let i = 0; i < AGENTS_TO_USE; i++) {
        const count = base + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        for (let j = 0; j < count; j++) {
            const rowRaw = tasks[taskIndex] || {};
            const row = normalizeRow(rowRaw);
            const firstName = row.firstname || row.name || 'Unknown';
            const phone = row.phone || row.mobile || '';
            const notes = row.notes || '';
            // Skip rows without phone
            if (!phone || String(phone).trim() === '') {
                taskIndex++;
                continue;
            }
            const taskData = { firstName, phone, notes, agent: agentsToUse[i]._id };
            distributedTasks.push(taskData);
            taskIndex++;
        }
    }

    // If for any reason some tasks remain (shouldn't happen), append them round-robin
    while (taskIndex < total) {
        const rowRaw = tasks[taskIndex] || {};
        const row = normalizeRow(rowRaw);
        const phone = row.phone || row.mobile || '';
        if (!phone || String(phone).trim() === '') {
            taskIndex++;
            continue;
        }
        const target = agentsToUse[taskIndex % agentsToUse.length]._id;
        distributedTasks.push({ firstName: row.firstname || row.name || 'Unknown', phone, notes: row.notes || '', agent: target });
        taskIndex++;
    }

    await Task.insertMany(distributedTasks);
    res.status(200).json({ message: 'Tasks uploaded & distributed successfully!', totalTasks: distributedTasks.length, agentsUsed: AGENTS_TO_USE });
}

// Get distributed tasks grouped by agent
const getDistributed = async (req, res) => {
    try {
        // Always return groups for the first 5 agents (assignment requirement)
        const agents = await Agent.find({}).sort({ _id: 1 }).limit(5).lean();

        // Fetch tasks for these agents
        const agentIds = agents.map(a => a._id);
        const tasks = await Task.find({ agent: { $in: agentIds } }).lean();

        // Build mapping agentId -> tasks
        const map = {};
        agentIds.forEach(id => { map[id.toString()] = []; });
        tasks.forEach(t => {
            const aId = t.agent ? t.agent.toString() : null;
            if (aId && map[aId]) {
                map[aId].push({ id: t._id, firstName: t.firstName, phone: t.phone, notes: t.notes });
            }
        });

        const result = agents.map(a => ({ agent: { _id: a._id, name: a.name, email: a.email, mobile: a.mobile || a.phone }, tasks: map[a._id.toString()] || [] }));
        return res.status(200).json(result);
    } catch (err) {
        console.error('getDistributed error:', err.stack || err.message || err);
        return res.status(500).json({ message: 'Server error while fetching distributed tasks', error: err.message });
    }
};

module.exports = { uploadAndDistribute, getDistributed };
