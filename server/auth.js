const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
        const result = await db.query(sql, [username, hashedPassword]);

        // For Postgres, we might need RETURNING id, but for sqlite wrapper returns { id: lastID }.
        // Let's standardise: if result is array (pg INSERT w/o returning), it's empty.
        // Actually, for PG we typically want ID back.
        // Simplified: just select user back or use username for token.

        res.status(201).json({ message: "User registered successfully", username });
    } catch (err) {
        if (err.message.includes('UNIQUE') || err.message.includes('unique')) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        return res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const sql = `SELECT * FROM users WHERE username = ?`;
        const rows = await db.query(sql, [username]);
        const user = rows[0];

        if (!user) return res.status(404).json({ error: 'User not found' });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ token: null, error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token, username: user.username, avatar_url: user.avatar_url });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
