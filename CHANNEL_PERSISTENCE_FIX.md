# Channel Persistence Issue - SOLUTION

## Problem
1. ✅ Channels can be created
2. ❌ Can't send messages to new channels
3. ❌ Channels disappear on refresh

## Root Cause
You're connected to the **Railway deployment** which uses **SQLite**. Railway's file system is **ephemeral**, meaning:
- SQLite database file (`chat.db`) is stored in the container
- When the container restarts (which happens frequently on free tier), the database is reset
- Only the default "general" channel persists because it's created in the init script

## The Fix: Run Locally

### Option 1: Run Both Server and Client Locally (RECOMMENDED)

#### Step 1: Start the Server
```powershell
cd server
npm install
npm start
```
The server should start on `http://localhost:3000`

#### Step 2: Start the Client (in a new terminal)
```powershell
cd client
npm install
npm run dev
```
The client should start on `http://localhost:5173`

#### Step 3: Open Browser
Go to `http://localhost:5173`

Now your channels will persist because they're saved to a local SQLite file at `server/chat.db`.

### Option 2: Configure Railway to Use PostgreSQL (For Production)

If you want to keep using Railway, you need to:

1. **Add PostgreSQL to Railway**:
   - Go to your Railway project
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will create a `DATABASE_URL` environment variable

2. **Install pg package** (if not already):
   ```powershell
   cd server
   npm install pg
   ```

3. **Restart your Railway deployment**
   - The app will automatically detect `DATABASE_URL` and use PostgreSQL
   - PostgreSQL data persists across container restarts

## What Was Fixed in the Code

### 1. Socket Handler (server/socket.js)
**Before:**
```javascript
const sql = `INSERT INTO messages (user_id, username, content) VALUES (?, ?, ?)`;
```

**After:**
```javascript
const sql = `INSERT INTO messages (user_id, username, content, channel_id) VALUES (?, ?, ?, ?)`;
```

Now messages are saved with the channel_id, so they appear in the correct channel.

### 2. Server Response (server/index.js)
Added better error handling for duplicate channel names and validation.

## Testing Locally

Once you're running locally:

1. ✅ Create a new channel (e.g., "random")
2. ✅ Switch to the new channel
3. ✅ Send a message - it should appear
4. ✅ Refresh the page - channel and messages should still be there
5. ✅ Check `server/chat.db` file exists (proves data is being saved)

## Why Railway Was Losing Data

Railway's free tier:
- Restarts containers frequently (every deploy, every sleep/wake)
- Doesn't persist files (SQLite database is a file)
- Only environment variables and PostgreSQL data persist

## Next Steps

**For Development:**
→ Run locally (Option 1)

**For Production:**
→ Use PostgreSQL on Railway (Option 2)

**Current Status:**
- ✅ Code is fixed and ready
- ⏳ Waiting for you to run locally or add PostgreSQL
