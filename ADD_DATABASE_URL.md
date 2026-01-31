# How to Connect DATABASE_URL - Visual Guide

## Current Situation

✅ PostgreSQL is running  
❌ Your app doesn't know about it (still using SQLite)  
❌ DATABASE_URL variable is missing from your app

---

## The Fix: Add DATABASE_URL Variable

### Visual Step-by-Step

#### 1. Open Railway Dashboard
Go to: https://railway.app/dashboard

#### 2. Open Your Project
Click on: `discord-clone-production-5ea9`

You should see **TWO boxes**:
```
┌─────────────────┐    ┌─────────────────┐
│   Your App      │    │   PostgreSQL    │
│   (Node.js)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘
```

#### 3. Click on Your APP (Left Box)
**NOT the PostgreSQL box** - click on your Node.js app

#### 4. Click "Variables" Tab
At the top, you'll see tabs:
```
Settings | Variables | Metrics | Deployments | ...
```
Click **"Variables"**

#### 5. Check if DATABASE_URL Exists

**If you see DATABASE_URL listed:**
- Great! Skip to Step 7 (Redeploy)

**If you DON'T see DATABASE_URL:**
- Continue to Step 6

#### 6. Add DATABASE_URL Variable

Click the **"New Variable"** button

You'll see two options:
```
┌─────────────────────────┐
│ Add Variable            │
│ Add Reference          │ ← Click this one!
└─────────────────────────┘
```

Click **"Add Reference"**

A dropdown will appear. Select:
```
Variable: DATABASE_URL
Service: [Your PostgreSQL service name]
```

Click **"Add"**

#### 7. Redeploy Your App

Now that DATABASE_URL is added:

1. Click **"Deployments"** tab (at the top)
2. Click the **"Redeploy"** button (top right)
3. Wait for deployment to complete (~1-2 minutes)

#### 8. Check the New Deployment Logs

Click on the latest deployment to see logs.

**Look for these lines:**
```
DATABASE_URL exists: true          ← Should be true!
DATABASE_URL starts with postgres: true
Initializing database adapter for: postgres  ← Should say postgres!
Database tables initialized.
Server running on port XXXX
```

---

## Alternative: Manual Method

If "Add Reference" doesn't work, you can add it manually:

### A. Get DATABASE_URL from PostgreSQL

1. Click on the **PostgreSQL service** (right box)
2. Click **"Variables"** tab
3. Find `DATABASE_URL`
4. Click the **copy icon** next to it
5. The value looks like:
   ```
   postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:5432/railway
   ```

### B. Add to Your App

1. Click on your **APP service** (left box)
2. Click **"Variables"** tab
3. Click **"New Variable"**
4. Click **"Add Variable"** (not reference)
5. Fill in:
   - **Variable Name:** `DATABASE_URL`
   - **Value:** Paste the URL you copied
6. Click **"Add"**

### C. Redeploy

Same as Step 7 above.

---

## Common Mistakes

### ❌ Mistake 1: Adding to PostgreSQL Service
Don't add DATABASE_URL to the PostgreSQL service - it's already there!
Add it to your **APP service** instead.

### ❌ Mistake 2: Not Redeploying
After adding the variable, you MUST redeploy for it to take effect.

### ❌ Mistake 3: Wrong Variable Name
Make sure it's exactly `DATABASE_URL` (all caps, with underscore)

---

## How to Verify Success

### In Railway Dashboard

**App Service → Variables Tab:**
```
✅ DATABASE_URL is listed
✅ Value starts with "postgresql://"
```

### In Deployment Logs

```
✅ DATABASE_URL exists: true
✅ Initializing database adapter for: postgres
```

### In Your Browser

```
✅ Create a channel
✅ Refresh page
✅ Channel is still there!
```

---

## Still Not Working?

### Check These:

1. **Is DATABASE_URL in the APP service Variables tab?**
   - If NO → Add it (Step 6)
   - If YES → Continue

2. **Did you redeploy after adding it?**
   - If NO → Redeploy (Step 7)
   - If YES → Continue

3. **Do the logs show "postgres"?**
   - If NO → DATABASE_URL might be wrong
   - If YES → Success! ✅

### Get the Exact Value

To debug, check what your app sees:

1. Go to APP service → Variables
2. Click on `DATABASE_URL` to expand it
3. Verify it starts with `postgresql://` (not `postgres://`)

---

## Expected Timeline

- **Finding Variables tab:** 30 seconds
- **Adding DATABASE_URL:** 1 minute
- **Redeploying:** 1-2 minutes
- **Verifying logs:** 30 seconds

**Total:** ~3-4 minutes

---

## What Happens After

Once DATABASE_URL is connected and you see "postgres" in logs:

✅ All channels persist  
✅ All messages saved to correct channels  
✅ Data survives restarts  
✅ App fully functional on Railway  

No more disappearing channels! 🎉
