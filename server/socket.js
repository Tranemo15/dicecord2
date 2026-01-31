const db = require('./db');
const jwt = require('jsonwebtoken');

const onlineUsers = new Map(); // socket.id -> user object

function broadcastOnlineUsers(io) {
    const users = Array.from(onlineUsers.values());
    // Deduplicate by id (if same user in multiple tabs)
    const uniqueUsers = [];
    const seenIds = new Set();
    for (const u of users) {
        if (!seenIds.has(u.id)) {
            uniqueUsers.push(u);
            seenIds.add(u.id);
        }
    }
    io.emit('onlineUsers', uniqueUsers);
}

module.exports = (io) => {
    io.on('connection', async (socket) => {
        console.log('User connected:', socket.id);

        // Authenticate and Track User
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
                const decoded = jwt.verify(token, JWT_SECRET);

                // Fetch full details (avatar)
                const rows = await db.query('SELECT id, username, avatar_url FROM users WHERE id = ?', [decoded.id]);
                if (rows.length > 0) {
                    const user = rows[0];
                    onlineUsers.set(socket.id, user);
                    broadcastOnlineUsers(io);
                }
            } catch (err) {
                console.error('Socket auth failed:', err.message);
            }
        }

        // Join the global chat room
        socket.join('global');

        socket.on('sendMessage', async (data) => {
            const { username, content, channel_id } = data;

            try {
                // Lookup correct user_id
                const userRows = await db.query('SELECT id, avatar_url FROM users WHERE username = ?', [username]);
                if (userRows.length === 0) {
                    socket.emit('error', 'User not found/Session invalid. Please relogin.');
                    return;
                }

                const realUserId = userRows[0].id;
                const avatar_url = userRows[0].avatar_url;

                // Use channel_id from payload, default to 1 (general) if not provided
                const targetChannelId = channel_id || 1;

                // Save to database with channel_id
                const sql = `INSERT INTO messages (user_id, username, content, channel_id) VALUES (?, ?, ?, ?)`;
                const result = await db.query(sql, [realUserId, username, content, targetChannelId]);

                io.to('global').emit('newMessage', {
                    id: result.id || Date.now(),
                    user_id: realUserId,
                    username,
                    avatar_url, // Include avatar here
                    content,
                    channel_id: targetChannelId,
                    created_at: new Date().toISOString()
                });
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            if (onlineUsers.has(socket.id)) {
                onlineUsers.delete(socket.id);
                broadcastOnlineUsers(io);
            }
        });
    });
};
