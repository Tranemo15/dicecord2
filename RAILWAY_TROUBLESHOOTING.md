# Railway PostgreSQL Troubleshooting

## Current Status
Your logs show:
```
Initializing database adapter for: sqlite
Connected to SQLite DB.
```

This means `DATABASE_URL` is **NOT** set or **NOT** detected.

---

## Step-by-Step Fix

### Step 1: Verify PostgreSQL is Added

1. Go to https://railway.app/dashboard
2. Open your project: `discord-clone-production-5ea9`
3. You should see **TWO services**:
   - Your app (e.g., "dicecord-master" or similar)
   - PostgreSQL database (shows PostgreSQL icon)

**If you only see ONE service:**
- Click **"New"** → **"Database"** → **"Add PostgreSQL"**
- Wait for it to deploy (takes ~30 seconds)

### Step 2: Check DATABASE_URL Variable

1. Click on your **APP service** (NOT the database)
2. Go to **"Variables"** tab
3. Look for `DATABASE_URL`

**Scenario A: DATABASE_URL exists**
- Value should look like: `postgresql://postgres:...@containers-us-west-...railway.app:5432/railway`
- ✅ Good! Go to Step 3

**Scenario B: DATABASE_URL doesn't exist**
- Click **"New Variable"**
- Click **"Add Reference"**
- Select `DATABASE_URL` from the dropdown
- Choose the PostgreSQL service
- Click **"Add"**

### Step 3: Redeploy with New Logs

After adding/verifying DATABASE_URL:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** (or trigger a new deployment)
3. Wait for deployment to complete
4. Click on the deployment to see logs

### Step 4: Check New Logs

You should now see:
```
✅ DATABASE_URL exists: true
✅ DATABASE_URL starts with postgres: true
✅ Initializing database adapter for: postgres
```

If you see `false` for any of these, DATABASE_URL isn't properly set.

---

## Alternative: Manual Environment Variable

If the reference doesn't work, you can manually copy the DATABASE_URL:

### Get DATABASE_URL from PostgreSQL Service

1. Click on the **PostgreSQL service** (not your app)
2. Go to **"Variables"** tab
3. Find `DATABASE_URL` and click the **copy icon**
4. It will look like:
   ```
   postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:5432/railway
   ```

### Add to Your App Service

1. Click on your **APP service**
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Name: `DATABASE_URL`
5. Value: Paste the copied URL
6. Click **"Add"**

### Redeploy

1. Go to **"Deployments"** tab
2. Click **"Redeploy"**

---

## Verify It's Working

After redeployment, check the logs for:

```
DATABASE_URL exists: true
DATABASE_URL starts with postgres: true
Initializing database adapter for: postgres
Database tables initialized.
Server running on port XXXX
```

---

## Common Issues

### Issue 1: "pg module not found"

**Solution:** Add `pg` to dependencies

1. Check `server/package.json` has:
   ```json
   "dependencies": {
     "pg": "^8.11.0"
   }
   ```

2. If missing, add it and redeploy

### Issue 2: DATABASE_URL shows but still using SQLite

**Possible causes:**
- DATABASE_URL doesn't start with `postgresql://` (check for typos)
- Environment variable not loaded (redeploy needed)
- Old deployment still running (force redeploy)

**Solution:**
1. Verify DATABASE_URL value starts with `postgresql://`
2. Click **"Redeploy"** to force a fresh deployment

### Issue 3: PostgreSQL service shows "Crashed"

**Solution:**
- Delete the PostgreSQL service
- Add a new one
- Reconnect DATABASE_URL

---

## Quick Checklist

- [ ] PostgreSQL service exists in Railway project
- [ ] PostgreSQL service status is "Active" (green)
- [ ] DATABASE_URL variable exists in app service
- [ ] DATABASE_URL value starts with `postgresql://`
- [ ] App has been redeployed after adding DATABASE_URL
- [ ] Logs show "postgres" not "sqlite"

---

## Still Not Working?

### Check Railway Service Logs

1. Click on **PostgreSQL service**
2. Go to **"Deployments"** tab
3. Check if there are any errors

### Check App Logs

1. Click on **App service**
2. Go to **"Deployments"** tab
3. Look for the debug messages I added:
   ```
   DATABASE_URL exists: false  ← Problem here!
   ```

### Screenshot What You See

Take screenshots of:
1. Railway project overview (showing both services)
2. App service Variables tab
3. App deployment logs

This will help diagnose the issue.

---

## Expected Result

**Before (SQLite):**
```
DATABASE_URL exists: false
Initializing database adapter for: sqlite
Connected to SQLite DB.
```

**After (PostgreSQL):**
```
DATABASE_URL exists: true
DATABASE_URL starts with postgres: true
Initializing database adapter for: postgres
Database tables initialized.
```

Once you see "postgres" in the logs, channels will persist! ✅
