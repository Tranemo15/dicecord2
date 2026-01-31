const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('./db');

// Config Multer for Memory Storage (keep it in RAM to insert to DB)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        // We can't check ext easily safely without magic numbers or trusting client mimetype.
        // Trust mimetype filter for now.
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images/gifs are allowed'));
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// GET all emojis
router.get('/', async (req, res) => {
    try {
        const rows = await db.query("SELECT * FROM custom_emojis");
        // Map to simple structure
        const emojiMap = {};
        rows.forEach(row => {
            // If image_data starts with 'data:', use it. 
            // If it's a legacy URL (from before we switched), use it.
            // row.image_data replaces row.url in new schema
            const src = row.image_data || row.url || '';
            emojiMap[row.name] = src;
        });
        res.json(emojiMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST upload emoji
router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Name validation
    let { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Emoji name is required' });

    name = name.replace(/:/g, '');
    const fullName = `:${name}:`;

    // Convert buffer to base64 data URI
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const mime = req.file.mimetype;
    const dataUri = `data:${mime};base64,${b64}`;

    try {
        // We use 'image_data' column.
        const sql = "INSERT INTO custom_emojis (name, image_data) VALUES (?, ?)";
        await db.query(sql, [fullName, dataUri]);

        res.json({ name: fullName, url: dataUri });
    } catch (err) {
        if (err.message.includes('UNIQUE') || err.message.includes('unique')) {
            return res.status(400).json({ error: 'Emoji name already taken' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
