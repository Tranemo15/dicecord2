# Running on Railway with Persistent Storage

## The Problem

Railway's file system is **ephemeral** - it resets when:
- You deploy new code
- The container restarts
- The app goes to sleep (free tier)

SQLite stores data in a **file** (`chat.db`), so it gets deleted when the container resets.

## The Solution: Use PostgreSQL on Railway

PostgreSQL is a **separate service** on Railway with **persistent storage**. Your code already supports it!

---

## Step-by-Step: Add PostgreSQL to Railway

### 1. Open Your Railway Project

Go to: https://railway.app/dashboard

Find your `discord-clone-production-5ea9` project

### 2. Add PostgreSQL Database

1. Click **"New"** button (top right)
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will create a new PostgreSQL service

### 3. Connect Database to Your App

Railway automatically creates a `DATABASE_URL` environment variable that links your app to PostgreSQL.

**Verify it:**
1. Click on your **app service** (not the database)
2. Go to **"Variables"** tab
3. You should see `DATABASE_URL` with a value like:
   ```
   postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
   ```

If you don't see it:
1. Click **"New Variable"**
2. Select **"Add Reference"**
3. Choose `DATABASE_URL` from the PostgreSQL service

### 4. Redeploy Your App

Your app needs to restart to detect the PostgreSQL database:

**Option A: Trigger a new deployment**
1. Go to **"Deployments"** tab
2. Click **"Deploy"** → **"Redeploy"**

**Option B: Push a small change**
```powershell
cd c:\Users\Luka\Documents\dicecord-master
git add .
git commit -m "Add PostgreSQL support"
git push
```

### 5. Verify It's Working

Once deployed, check the logs:
1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Look for:
   ```
   Initializing database adapter for: postgres
   Database tables initialized.
   Server running on port XXXX
   ```

If you see `postgres` instead of `sqlite`, it's working! ✅

---

## Update Client to Use Railway

Remove the `.env.local` file I created (or update it):

**Option 1: Delete `.env.local`** (recommended)
```powershell
cd c:\Users\Luka\Documents\dicecord-master\client
del .env.local
```

The client will automatically use Railway's URL.

**Option 2: Update `.env.local`**
```
VITE_API_URL=https://discord-clone-production-5ea9.up.railway.app
```

Then restart your client:
```powershell
npm run dev
```

---

## Testing

1. **Open your app** at your Railway URL
2. **Create a new channel** (e.g., "test-persistent")
3. **Send a message** in the channel
4. **Refresh the page** - channel should still be there! ✅
5. **Wait 5 minutes and refresh again** - still there! ✅

---

## How It Works

Your code in `server/db.js` automatically detects the database type:

```javascript
this.type = (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) 
    ? 'postgres' 
    : 'sqlite';
```

When `DATABASE_URL` exists and starts with `postgres`, it uses PostgreSQL.
Otherwise, it uses SQLite.

---

## Cost

**PostgreSQL on Railway:**
- ✅ **Free tier**: 512MB storage, 1GB RAM
- ✅ **Persistent**: Data survives restarts
- ✅ **Shared**: All your Railway apps can use it

**No additional cost** if you're on the free tier!

---

## Troubleshooting

### "pg module not found"

Your `package.json` should already have `pg` listed. If not:

1. Add it to `server/package.json`:
   ```json
   "dependencies": {
     "pg": "^8.11.0",
     ...
   }
   ```

2. Redeploy

### Still seeing SQLite in logs

- Check that `DATABASE_URL` variable exists in your app service
- Make sure it starts with `postgresql://`
- Redeploy the app

### Channels still disappearing

- Verify logs show "postgres" not "sqlite"
- Check that PostgreSQL service is running (green status)
- Make sure you're testing on the Railway URL, not localhost

---

## Summary

**Before (SQLite):**
- ❌ Data stored in file
- ❌ File deleted on restart
- ❌ Channels disappear

**After (PostgreSQL):**
- ✅ Data stored in database service
- ✅ Database persists across restarts
- ✅ Channels persist forever

**Next Steps:**
1. Add PostgreSQL to Railway project
2. Verify `DATABASE_URL` exists
3. Redeploy app
4. Test channel persistence
