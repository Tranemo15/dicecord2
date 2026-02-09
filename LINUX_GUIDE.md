# Dicecord Linux (Debian/Ubuntu) Setup Guide

This guide details how to set up and run the Dicecord server on a Debian/Ubuntu Linux environment.

## 1. System Requirements

- **OS**: Debian 11/12 or Ubuntu 20.04/22.04 +
- **Memory**: 1GB+ RAM recommended
- **Disk**: 10GB+ free space

## 2. Automated Setup (Recommended)

We have provided a script `setup_debian.sh` to automate the installation of Node.js, system build tools, and project dependencies.

1.  Transfer the `dicecord-master` folder to your Linux server.
2.  Open a terminal in the folder.
3.  Make the script executable and run it:
    ```bash
    chmod +x setup_debian.sh
    sudo ./setup_debian.sh
    ```

## 3. Manual Installation

If you prefer to install manually, follow these steps:

### A. Install System Dependencies

```bash
sudo apt update
sudo apt install -y curl git build-essential python3
```

### B. Install Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### C. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### D. Install Project Dependencies & Build

Navigate to the project root and use the build script:

```bash
npm run build
```

*This command installs dependencies for both client and server and builds the client frontend.*

## 4. Running the Server

To keep the server running in the background (production mode), use PM2.

1.  Navigate to the server directory:
    ```bash
    cd server
    ```

2.  Start the application:
    ```bash
    # Set NODE_ENV to production to serve the built client files
    NODE_ENV=production pm2 start index.js --name "dicecord"
    ```

    *Note: `NODE_ENV=production` ensures the server serves the `client/dist` folder at `/`.*

3.  Ensure it restarts on reboot:
    ```bash
    pm2 save
    pm2 startup
    ```

## 5. Required Files & Folders

When transferring to the Linux server, ensure you include:

- `client/` (Source code)
- `server/` (Source code)
- `package.json` (Root)
- `setup_debian.sh`

*Note: You do NOT need to transfer `node_modules` folders. They will be recreated during installation.*

## 6. Troubleshooting

-   **SQLite Errors**: If you see errors related to `better-sqlite3` or `sqlite3`, ensure you have `build-essential` and `python3` installed, then try reinstalling dependencies in the server folder: `cd server && npm rebuild` or `rm -rf node_modules && npm install`.
-   **Permission Denied**: Ensure the user running the server has write permissions to the `server/exports` and `server/chat.db` files.
