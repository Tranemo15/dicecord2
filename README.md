# Discord Clone

A simple, real-time chat application inspired by Discord.

## Features
- **Real-time Messaging**: Powered by Socket.io.
- **Authentication**: Secure login and registration.
- **Single Global Chat**: Join the server and chat with everyone.
- **Responsive Design**: Mobile-friendly dark mode interface.

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS
- **Backend**: Node.js, Express, Socket.io
- **Database**: SQLite (Local file-based)

## Getting Started

### Prerequisites
- Node.js installed

### Installation

1. Install dependencies for server and client:
   ```bash
   cd server
   npm install
   cd ../client
   npm install
   ```
test

2. Start the development servers:
   
   Terminal 1 (Server):
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Client):
   ```bash
   cd client
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`.

## Deployment on Render.com

1. Create a new Web Service on Render.
2. Connect your GitHub repository.
3. Render should automatically detect `render.yaml` configuration.
4. **Note**: Since this uses SQLite, the database is reset on every deployment/restart on Render's free tier. For persistence, consider switching to a hosted PostgreSQL or MongoDB.

## Project Structure

- `client/`: React frontend code
- `server/`: Node.js backend code
- `render.yaml`: Configuration for deployment
