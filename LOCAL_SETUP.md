# Quick Start Guide - Run Locally

## Current Issue
✅ Messages work  
❌ Channels disappear on refresh

**Reason:** You're still connected to Railway (ephemeral storage)

## Solution: Run Local Server

### Step 1: Start the Local Server

Open a **NEW PowerShell terminal** and run:

```powershell
cd c:\Users\Luka\Documents\dicecord-master\server
npm start
```

You should see:
```
Connected to SQLite DB.
Database tables initialized.
Server running on port 3000
```

**Keep this terminal open!** Don't close it.

### Step 2: Restart the Client

In your **current terminal** where the client is running:

1. Press `Ctrl+C` to stop the client
2. Run:
```powershell
npm run dev
```

The client will now connect to `http://localhost:3000` (your local server) instead of Railway.

### Step 3: Test It

1. **Refresh your browser** at `http://localhost:5173`
2. **Create a new channel** (e.g., "test-channel")
3. **Send a message** in the new channel
4. **Refresh the page** - the channel should still be there! ✅

## How to Verify You're Running Locally

Check the browser console (F12):
- ❌ Bad: `WebSocket connection to 'wss://discord-clone-production-5ea9.up.railway.app/...'`
- ✅ Good: `WebSocket connection to 'ws://localhost:3000/...'`

## What I Did

Created `.env.local` file in the client folder with:
```
VITE_API_URL=http://localhost:3000
```

This tells the client to connect to your local server instead of Railway.

## Troubleshooting

### "npm is not recognized"
You need to install Node.js first. But if you're already running the client, this shouldn't be an issue.

### "Port 3000 is already in use"
Another process is using port 3000. Either:
- Close that process
- Or change the port in `server/index.js` (line 342) to `3001` and update `.env.local` to `http://localhost:3001`

### Still seeing Railway URL
1. Make sure you stopped and restarted the client (Ctrl+C, then `npm run dev`)
2. Hard refresh the browser (Ctrl+Shift+R)
3. Check that `.env.local` exists in the `client` folder

## Success Indicators

When everything is working:
- ✅ Server terminal shows "Server running on port 3000"
- ✅ Client terminal shows "Local: http://localhost:5173"
- ✅ Browser console shows WebSocket to `localhost:3000`
- ✅ Channels persist after refresh
- ✅ Messages appear in the correct channel
- ✅ A `chat.db` file appears in the `server` folder

## Data Location

Your local data is stored in:
```
c:\Users\Luka\Documents\dicecord-master\server\chat.db
```

This file persists all:
- Users
- Messages
- Channels
- Emojis
