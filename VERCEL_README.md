# Deployment for Dicecord (Discord Clone)

This project has been configured for deployment on Vercel. However, due to its architecture (Node.js monolith with WebSockets + SQLite), there are significant considerations.

## ⚠️ Important Limitations on Vercel
1.  **SQLite (chat.db) will NOT work**: Vercel Serverless environment is ephemeral. Any data saved to the local `chat.db` will be lost immediately.
    -   **Solution**: You MUST use a cloud database (e.g. Vercel Postgres, Neon, or Railway Postgres).
    -   Set `DATABASE_URL` environment variable in Vercel to your Postgres connection string (e.g., `postgres://user:pass@host/db`).
2.  **WebSockets (Socket.io) might fail**: Vercel Serverless Functions do not support persistent WebSocket connections.
    -   Real-time chat features may not work as expected.
    -   **Recommendation**: Use a dedicated notification service (Pusher) or deploy the backend to a platform that supports persistent servers like Render, Railway, or Heroku.
        -   If you choose this, only deploy the `client` folder to Vercel and set `VITE_API_URL` to your backend URL.
3.  **File Uploads (Multer)**: Will fail because Vercel file system is read-only.
    -   **Solution**: Use configured object storage (S3, Cloudinary, etc.) instead of local file storage.
    -   Or disable upload functionality in the code.

## Deployment Instructions

### Option A: Monolith Deployment (Experimental)
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the root directory.
3.  Set the Environment Variable `DATABASE_URL` to a valid Postgres database URL.
4.  The `vercel.json` config attempts to route API requests to `server/index.js` and serve the client.

### Option B: Split Deployment (Recommended)
**Backend (Server)**
1.  Use Render, Railway, or Heroku.
2.  Point them to the `server` directory or use `render.yaml` (already included!).
3.  Set `DATABASE_URL` and `JWT_SECRET`.

**Frontend (Client)**
1.  Deploy only the `client` directory to Vercel.
2.  In Vercel Project Settings -> Root Directory, select `client`.
3.  Add environment variable `VITE_API_URL` pointing to your deployed backend URL.
    -   *Note*: You might need to update `vite.config.js` to use `process.env.VITE_API_URL` instead of proxy for production build if proxying logic isn't sufficient.

## Local Development
-   Run `npm run build` in root to build everything.
-   Run `npm start` in root to start the backend (which serves frontend in production mode).
