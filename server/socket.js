const db = require('./db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join the global chat room
        socket.join('global');

        socket.on('sendMessage', async (data) => {
            const { username, content } = data;

            try {
                // Lookup correct user_id
                const userRows = await db.query('SELECT id, avatar_url FROM users WHERE username = ?', [username]);
                if (userRows.length === 0) {
                    socket.emit('error', 'User not found/Session invalid. Please relogin.');
                    return;
                }

                const realUserId = userRows[0].id;
                const avatar_url = userRows[0].avatar_url;

                // Save to database
                const sql = `INSERT INTO messages (user_id, username, content) VALUES (?, ?, ?)`;
                const result = await db.query(sql, [realUserId, username, content]);

                io.to('global').emit('newMessage', {
                    id: result.id || Date.now(),
                    user_id: realUserId,
                    username,
                    avatar_url, // Include avatar here
                    content,
                    created_at: new Date().toISOString()
                });
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
