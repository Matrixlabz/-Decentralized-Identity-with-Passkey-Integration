#!/bin/bash

# Decentralized Identity Platform Setup Script
# This script sets up the entire development environment

set -e

echo "Setting up Decentralized Identity Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Check if Docker is installed (for MongoDB)
if ! command -v docker &> /dev/null; then
    echo "Warning: Docker is not installed. MongoDB will need to be installed separately."
fi

# Install dependencies for all packages
echo "Installing dependencies..."

# Root dependencies
echo "Installing root dependencies..."
npm install

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Smart contracts dependencies
echo "Installing smart contracts dependencies..."
cd smart-contracts
npm install
cd ..

# Shared dependencies
echo "Installing shared dependencies..."
cd shared
npm install
cd ..

# Create environment files
echo "Setting up environment files..."

# Backend environment file
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/decentralized-identity

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=your-testnet-secret-key
STELLAR_PUBLIC_KEY=your-testnet-public-key

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Blockchain Storage
STORE_ON_BLOCKCHAIN=false
EOF
    echo "Created backend/.env file"
fi

# Frontend environment file
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Decentralized Identity

# Stellar Configuration
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_CONTRACT_IDENTITY_REGISTRY=
VITE_STELLAR_CONTRACT_SELECTIVE_DISCLOSURE=

# Feature Flags
VITE_ENABLE_ZK_PROOFS=true
VITE_ENABLE_BIOMETRIC_AUTH=true
EOF
    echo "Created frontend/.env file"
fi

# Smart contracts environment file
if [ ! -f smart-contracts/.env ]; then
    cat > smart-contracts/.env << EOF
# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=your-testnet-secret-key
STELLAR_PUBLIC_KEY=your-testnet-public-key

# Contract Configuration
CONTRACT_BUILD_DIR=target/wasm32-unknown-unknown/release
EOF
    echo "Created smart-contracts/.env file"
fi

# Create logs directory
mkdir -p backend/logs

# Create deployment directory
mkdir -p smart-contracts/deployment

# Start MongoDB if Docker is available
if command -v docker &> /dev/null; then
    echo "Starting MongoDB..."
    docker run -d --name decentralized-identity-mongo -p 27017:27017 mongo:latest
    echo "MongoDB started on port 27017"
else
    echo "Please start MongoDB manually on port 27017"
fi

# Build shared package
echo "Building shared package..."
cd shared
npm run build
cd ..

echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update the environment files with your actual configuration"
echo "2. Start the development servers with: npm run dev"
echo "3. Deploy smart contracts with: npm run deploy:contracts"
echo ""
echo "For more information, see the README.md file."
