# Final Steps: Connect PostgreSQL to Your App

## ✅ PostgreSQL is Running!

Your PostgreSQL database is deployed and ready. Now you need to connect it to your app.

---

## Step 1: Get DATABASE_URL from PostgreSQL

1. In Railway, click on the **PostgreSQL service** (the one with database icon)
2. Go to the **"Variables"** tab
3. You should see `DATABASE_URL` with a value like:
   ```
   postgresql://postgres:xxxxx@containers-us-west-xxx.railway.app:5432/railway
   ```
4. **Copy this entire URL** (click the copy icon)

---

## Step 2: Add DATABASE_URL to Your App

1. Click on your **APP service** (the one running your Node.js code)
2. Go to the **"Variables"** tab
3. Click **"New Variable"**

**Option A: Add as Reference (Recommended)**
- Click **"Add Reference"**
- Select `DATABASE_URL` from the dropdown
- Choose the PostgreSQL service
- Click **"Add"**

**Option B: Add Manually**
- Name: `DATABASE_URL`
- Value: Paste the URL you copied
- Click **"Add"**

---

## Step 3: Redeploy Your App

After adding the variable:

1. Go to your **APP service**
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button
4. Wait for deployment to complete (~1-2 minutes)

---

## Step 4: Verify It's Working

1. Click on the latest deployment
2. Check the logs for:

**✅ Success - You should see:**
```
DATABASE_URL exists: true
DATABASE_URL starts with postgres: true
Initializing database adapter for: postgres
Database tables initialized.
Server running on port XXXX
```

**❌ Still wrong - You'll see:**
```
DATABASE_URL exists: false
Initializing database adapter for: sqlite
```

If you still see SQLite, the DATABASE_URL variable wasn't added correctly. Go back to Step 2.

---

## Step 5: Test Channel Persistence

Once logs show "postgres":

1. **Open your app** in the browser
2. **Create a new channel** (e.g., "test-persistent")
3. **Send a message** in the channel
4. **Refresh the page** → Channel should still be there! ✅
5. **Wait 5 minutes, refresh again** → Still there! ✅
6. **Close browser, reopen** → Still there! ✅

---

## Troubleshooting

### "DATABASE_URL exists: false" after redeployment

**Problem:** Variable wasn't added correctly

**Solution:**
1. Go to APP service → Variables tab
2. Verify `DATABASE_URL` is listed
3. If not, add it again (Step 2)
4. Redeploy again

### "pg module not found" error

**Problem:** `pg` package not installed

**Solution:**
1. Check `server/package.json` has:
   ```json
   "dependencies": {
     "pg": "^8.11.0"
   }
   ```
2. If missing, add it locally:
   ```powershell
   cd server
   npm install pg
   git add package.json package-lock.json
   git commit -m "Add pg dependency"
   git push
   ```

### Still using SQLite after everything

**Possible causes:**
- Old deployment cached
- DATABASE_URL doesn't start with `postgresql://`
- Environment variable not loaded

**Solution:**
1. Delete the deployment
2. Trigger a completely fresh deploy
3. Check DATABASE_URL value starts with `postgresql://` (not `postgres://`)

---

## Expected Timeline

- **Step 1-2:** 2 minutes (add variable)
- **Step 3:** 1-2 minutes (redeploy)
- **Step 4:** 30 seconds (check logs)
- **Step 5:** 1 minute (test)

**Total:** ~5 minutes to complete

---

## Success Indicators

When everything is working:

✅ PostgreSQL service shows "Active" (green)  
✅ App service shows "Active" (green)  
✅ App logs show "postgres" not "sqlite"  
✅ Channels persist after refresh  
✅ Messages appear in correct channels  
✅ Data survives app restarts  

---

## What Happens Next

Once connected to PostgreSQL:

- **All data persists forever** (until you delete the database)
- **Channels won't disappear** on refresh
- **Messages are saved** to the correct channels
- **Users, emojis, everything persists**

Your app will be fully functional on Railway! 🚀
