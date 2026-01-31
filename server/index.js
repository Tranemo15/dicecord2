require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./auth');
const socketHandler = require('./socket');
const db = require('./db');
const path = require('path');
let upload;
try {
    const multer = require('multer');
    const fs = require('fs');

    // Configure Multer for file uploads
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            // Keep original extension
            const ext = path.extname(file.originalname);
            cb(null, Date.now() + ext);
        }
    });

    upload = multer({ storage: storage });
} catch (err) {
    console.warn('Multer (file upload library) not found. Uploads will be disabled.');
    // Mock middleware that does nothing but pass control
    upload = {
        single: () => (req, res, next) => next()
    };
}

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
// app.use('/api/emojis', require('./emojis')); // Removed in favor of inline implementation
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Get Emojis Route
app.get('/api/emojis', async (req, res) => {
    const sql = `SELECT * FROM emojis ORDER BY name ASC`;
    try {
        const rows = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Emoji Route
app.post('/api/emojis', upload.single('emoji'), async (req, res) => {
    const { name } = req.body;
    const file = req.file;

    if (!name || !file) {
        return res.status(400).json({ error: 'Name and file are required' });
    }

    const url = `/uploads/${file.filename}`;
    const sql = `INSERT INTO emojis (name, url) VALUES (?, ?)`;

    try {
        const result = await db.query(sql, [name, url]);
        res.json({ id: result.id, name, url });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key')) {
            return res.status(400).json({ error: 'Emoji name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get Messages Route
app.get('/api/messages', async (req, res) => {
    try {
        const sql = `
            SELECT messages.*, users.avatar_url, users.banner_url 
            FROM messages 
            LEFT JOIN users ON messages.user_id = users.id 
            ORDER BY messages.created_at DESC 
            LIMIT 1000000000000000
        `;
        const rows = await db.query(sql);
        res.json(rows.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User Profile
app.get('/api/user/:username', async (req, res) => {
    try {
        const rows = await db.query('SELECT username, avatar_url, banner_url, bio FROM users WHERE username = ?', [req.params.username]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Users Route
app.get('/api/users', async (req, res) => {
    try {
        const rows = await db.query('SELECT id, username, avatar_url, bio FROM users ORDER BY username ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ... (existing routes) ...

// Upload User Avatar Route (Update to return full profile if needed, currently returns just url)
app.post('/api/user/avatar', upload.single('avatar'), async (req, res) => {
    const { username } = req.body;
    const file = req.file;

    if (!username || !file) {
        return res.status(400).json({ error: 'Username and file are required' });
    }

    const url = `/uploads/${file.filename}`;
    const sql = `UPDATE users SET avatar_url = ? WHERE username = ?`;

    try {
        await db.query(sql, [url, username]);
        res.json({ avatar_url: url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload User Banner Route
app.post('/api/user/banner', upload.single('banner'), async (req, res) => {
    const { username } = req.body;
    const file = req.file;

    if (!username || !file) {
        return res.status(400).json({ error: 'Username and file are required' });
    }

    const url = `/uploads/${file.filename}`;
    const sql = `UPDATE users SET banner_url = ? WHERE username = ?`;

    try {
        await db.query(sql, [url, username]);
        res.json({ banner_url: url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User Bio Route
app.post('/api/user/bio', async (req, res) => {
    const { username, bio } = req.body;

    if (!username || bio === undefined) {
        return res.status(400).json({ error: 'Username and bio are required' });
    }

    const sql = `UPDATE users SET bio = ? WHERE username = ?`;

    try {
        await db.query(sql, [bio, username]);
        res.json({ bio });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Discord Clone Server is Running (Dev Mode)');
    });
}

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io); // Attach io to app for use in routes

socketHandler(io);

// Get Messages Route (Updated to include is_pinned)
app.get('/api/messages', async (req, res) => {
    try {
        const sql = `
            SELECT messages.*, users.avatar_url, users.banner_url 
            FROM messages 
            LEFT JOIN users ON messages.user_id = users.id 
            ORDER BY messages.created_at DESC 
            LIMIT 1000000000000000
        `;
        const rows = await db.query(sql);
        res.json(rows.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Pin Route
app.post('/api/messages/:id/pin', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get current status
        const rows = await db.query('SELECT is_pinned FROM messages WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Message not found' });

        const currentStatus = rows[0].is_pinned;
        const newStatus = currentStatus ? 0 : 1;

        // 2. Update DB
        await db.query('UPDATE messages SET is_pinned = ? WHERE id = ?', [newStatus, id]);

        // 3. Emit event
        const io = req.app.get('io');
        io.emit('messageUpdated', { id: parseInt(id), is_pinned: newStatus });

        res.json({ id, is_pinned: newStatus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

// Initialize DB then start server
db.init().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
