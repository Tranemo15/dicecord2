# System Requirements & Installation Manifest

This file lists all necessary components and dependencies required to run Dicecord.

## Operating System
- **Recommended**: Debian 11/12 (Bullseye/Bookworm) or Ubuntu 22.04 LTS
- **Supported**: Any modern Linux distribution, Windows 10/11, macOS

## System Packages (Apt / Linux)
These are required for compiling native Node.js modules (like SQLite) and managing the process.
- `curl` (for downloading installers)
- `git` (for version control)
- `build-essential` (gcc, g++, make - for compiling native addons)
- `python3` (dependency for node-gyp)

## Runtime Environment
- **Node.js**: Version 18.x or 20.x (LTS)
- **NPM**: Version 9.x+ (comes with Node.js)

## Process Management (Recommended for Production)
- **PM2**: `npm install -g pm2`
  - Used to keep the server alive, handle restarts, and manage logs.

## Application Dependencies
These are installed automatically via `npm install` or `npm run build`.

### Server (Node.js/Express)
- `express`: Web server framework
- `socket.io`: Real-time bidirectional communication
- `sqlite3`: SQL database engine
- `pg`: PostgreSQL client (optional, installed by default)
- `@libsql/client`: Turso DB client (optional, installed by default)
- `bcryptjs`: Password hashing
- `jsonwebtoken`: Authentication (JWT)
- `cors`: Cross-Origin Resource Sharing
- `dotenv`: Environment variable management
- `multer`: File handling (uploads)
- `nodemon`: Development auto-restarter (Dev only)

### Client (React/Vite)
- `react`, `react-dom`: UI library
- `react-router-dom`: Routing
- `socket.io-client`: WebSocket client
- `axios`: HTTP client
- `vite`: Build tool/Bundler
- `emoji-picker-react`: Emoji selector
- `lucide-react`: Icon set
- `date-fns`: Date formatting

## Network Ports
- **3000** (Default): Main application port (HTTP + WebSocket).
  - Can be changed via `PORT` environment variable.
