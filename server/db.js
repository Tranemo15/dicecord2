const sqlite3 = require('sqlite3').verbose();
// const { Pool } = require('pg'); // Lazy loaded below
const path = require('path');

class Database {
  constructor() {
    // Debug: Show DATABASE_URL status
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
      console.log('DATABASE_URL starts with postgres:', process.env.DATABASE_URL.startsWith('postgres'));
    }

    // Check for Turso (Cloud SQLite)
    this.type = (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) ? 'turso' :
      (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres') || process.env.DATABASE_URL.startsWith('postgresql'))) ? 'postgres' : 'sqlite';
    console.log(`Initializing database adapter for: ${this.type}`);

    if (this.type === 'turso') {
      const { createClient } = require('@libsql/client');
      this.turso = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      console.log('Connected to Turso Cloud SQLite.');
    } else if (this.type === 'postgres') {
      const { Pool } = require('pg');
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Railway/Heroku
      });
    } else {
      let dbPath;
      if (process.env.VERCEL) {
        // Vercel only allows writing to /tmp
        dbPath = path.join('/tmp', 'chat.db');
        console.log('Running on Vercel, using ephemeral DB at:', dbPath);
      } else {
        dbPath = path.resolve(__dirname, 'chat.db');
      }

      this.sqlite = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Error opening SQLite DB:', err.message);
        else console.log('Connected to SQLite DB at', dbPath);
      });
    }
  }

  async query(sql, params = []) {
    if (this.type === 'turso') {
      try {
        // Turso returns { columns: [], rows: [] } usually, but execute returns ResultSet
        // We need to normalize the output to be an array of objects like sqlite/pg
        const result = await this.turso.execute({ sql, args: params });

        // Normalize rows. If using http driver, rows are objects.
        const rows = result.rows;

        // Also need to support returning { id: lastID } for INSERTs
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
          // lastInsertRowid is BigInt, convert to Number
          return { id: Number(result.lastInsertRowid), changes: result.rowsAffected };
        }
        if (sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE')) {
          return { changes: result.rowsAffected };
        }
        return rows;
      } catch (err) {
        console.error('Turso Query Error:', err);
        throw err;
      }
    } else if (this.type === 'postgres') {
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
    // Re-check environment variable to be absolutely sure
    const isPg = (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres') || process.env.DATABASE_URL.startsWith('postgresql'))) || this.type === 'postgres';
    console.log(`[db.js] init() called. isPg=${isPg}, this.type=${this.type}`);

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

      // Channels table - Simplified for stability
      await this.query(`
        CREATE TABLE IF NOT EXISTS channels (
          id ${idType},
          name TEXT UNIQUE,
          type TEXT DEFAULT 'text',
          created_at ${timestamp}
        )
      `);

      // Ensure 'general' channel exists using simple syntax
      try {
        const channels = await this.query('SELECT count(*) as count FROM channels');
        // If table is empty, insert general
        if (channels[0].count == 0 || channels[0].count === '0') {
          await this.query("INSERT INTO channels (name) VALUES ('general')");
        }
      } catch (e) {
        // Fallback if query fails, valid for some DB states
        try {
          await this.query("INSERT INTO channels (name) VALUES ('general')");
        } catch (err) { /* Ignore duplicate */ }
      }

      // Add channel_id to messages (legacy support)
      try {
        await this.query('ALTER TABLE messages ADD COLUMN channel_id INTEGER DEFAULT 1');
      } catch (err) {
        // Ignore
      }

      console.log('Database tables initialized.');
    } catch (err) {
      console.error('Failed to init DB tables:', err);
    }
  }
}

module.exports = new Database();
