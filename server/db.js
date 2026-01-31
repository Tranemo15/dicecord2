const sqlite3 = require('sqlite3').verbose();
// const { Pool } = require('pg'); // Lazy loaded below
const path = require('path');

class Database {
  constructor() {
    this.type = (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) ? 'postgres' : 'sqlite';
    console.log(`Initializing database adapter for: ${this.type}`);

    if (this.type === 'postgres') {
      const { Pool } = require('pg');
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Railway/Heroku
      });
    } else {
      const dbPath = path.resolve(__dirname, 'chat.db');
      this.sqlite = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Error opening SQLite DB:', err.message);
        else console.log('Connected to SQLite DB.');
      });
    }
  }

  async query(sql, params = []) {
    if (this.type === 'postgres') {
      // Rewrite ? to $1, $2, etc. for Postgres
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const res = await this.pool.query(pgSql, params);
      return res.rows; // Always returns array
    } else {
      return new Promise((resolve, reject) => {
        // Handle SELECT vs INSERT/UPDATE logic for consistent return
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          this.sqlite.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        } else {
          this.sqlite.run(sql, params, function (err) {
            if (err) reject(err);
            // Return object mimicking pg structure if needed, or simple success
            else resolve({ id: this.lastID, changes: this.changes });
          });
        }
      });
    }
  }

  async init() {
    const isPg = this.type === 'postgres';
    const idType = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const timestamp = isPg ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
    const textUnique = isPg ? 'TEXT UNIQUE' : 'TEXT UNIQUE';

    try {
      // Users table
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id ${idType},
          username ${textUnique},
          password TEXT,
          avatar_url TEXT,
          banner_url TEXT,
          bio TEXT,
          created_at ${timestamp}
        )
      `);

      // Attempt to add columns if they don't exist
      const columnsToAdd = ['avatar_url', 'banner_url', 'bio'];
      for (const col of columnsToAdd) {
        try {
          await this.query(`ALTER TABLE users ADD COLUMN ${col} TEXT`);
        } catch (err) {
          // Ignore if exists
        }
      }

      // Messages table
      await this.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id ${idType},
          user_id INTEGER,
          username TEXT,
          content TEXT,
          created_at ${timestamp},
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `);

      // Emojis table (Modified to match Head requirements: name, url)
      await this.query(`
        CREATE TABLE IF NOT EXISTS emojis (
          id ${idType},
          name TEXT UNIQUE,
          url TEXT,
          created_at ${timestamp}
        )
      `);

      // Add is_pinned column if it doesn't exist
      try {
        await this.query('ALTER TABLE messages ADD COLUMN is_pinned INTEGER DEFAULT 0');
      } catch (err) {
        // Ignore if column already exists
      }

      // Channels table
      await this.query(`
        CREATE TABLE IF NOT EXISTS channels (
          id ${idType},
          name TEXT UNIQUE,
          type TEXT DEFAULT 'text',
          created_at ${timestamp}
        )
      `);

      // Add default channel
      await this.query(`INSERT OR IGNORE INTO channels (id, name) VALUES (1, 'general')`);

      // Add channel_id to messages
      try {
        await this.query('ALTER TABLE messages ADD COLUMN channel_id INTEGER DEFAULT 1');
      } catch (err) {
        // Ignore
      }

      // Ensure old messages have channel_id = 1
      await this.query('UPDATE messages SET channel_id = 1 WHERE channel_id IS NULL');

      console.log('Database tables initialized.');
    } catch (err) {
      console.error('Failed to init DB tables:', err);
    }
  }
}

module.exports = new Database();
