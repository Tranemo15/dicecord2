#!/bin/bash

# Dicecord - Debian/Ubuntu Setup Script
# Run this script with sudo: sudo ./setup_debian.sh

set -e # Exit on error

echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "Installing build prerequisites (Python, GCC, Make - needed for SQLite/Native modules)..."
sudo apt install -y curl git build-essential python3

echo "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "Verifying Node.js version..."
node -v
npm -v

echo "Installing PM2 (Process Manager) globally..."
sudo npm install -g pm2

echo "Installing Project Dependencies & Building Client..."
# Navigate to project root if not already there (assuming script is in root)
cd "$(dirname "$0")"

# Use the root package.json build script which handles:
# 1. client npm install
# 2. client build (vite)
# 3. server npm install
npm run build

echo "Setup complete!"
echo ""
echo "To start the server in production mode with PM2:"
echo "1. Navigate to the server directory: cd server"
echo "2. Start the app: pm2 start index.js --name \"dicecord\" --env production"
echo "3. (Optional) Save PM2 list to resurrect on reboot: pm2 save && pm2 startup"
echo ""
echo "To view logs: pm2 logs dicecord"
