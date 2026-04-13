#!/bin/bash

# Decentralized Identity Platform Deployment Script
# This script deploys the entire platform to different environments

set -e

ENVIRONMENT=${1:-development}
NETWORK=${2:-testnet}

echo "Deploying Decentralized Identity Platform to $ENVIRONMENT environment..."

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Invalid environment. Use: development, staging, or production"
    exit 1
fi

# Validate network
if [[ "$NETWORK" != "testnet" && "$NETWORK" != "mainnet" && "$NETWORK" != "standalone" ]]; then
    echo "Error: Invalid network. Use: testnet, mainnet, or standalone"
    exit 1
fi

echo "Using network: $NETWORK"

# Build all packages
echo "Building packages..."
npm run build

# Deploy smart contracts
echo "Deploying smart contracts..."
cd smart-contracts
if [[ "$NETWORK" == "testnet" ]]; then
    npm run deploy:testnet
elif [[ "$NETWORK" == "mainnet" ]]; then
    npm run deploy:mainnet
else
    npm run deploy
fi
cd ..

# Update environment files with deployed contract addresses
echo "Updating environment files..."
CONTRACT_DEPLOYMENT_FILE="smart-contracts/deployment/$NETWORK-deployment.json"

if [ -f "$CONTRACT_DEPLOYMENT_FILE" ]; then
    # Extract contract addresses
    IDENTITY_REGISTRY_ADDRESS=$(jq -r '.contracts[] | select(.name == "IdentityRegistry") | .address' "$CONTRACT_DEPLOYMENT_FILE")
    SELECTIVE_DISCLOSURE_ADDRESS=$(jq -r '.contracts[] | select(.name == "SelectiveDisclosure") | .address' "$CONTRACT_DEPLOYMENT_FILE")

    # Update frontend environment
    sed -i "s/VITE_STELLAR_CONTRACT_IDENTITY_REGISTRY=.*/VITE_STELLAR_CONTRACT_IDENTITY_REGISTRY=$IDENTITY_REGISTRY_ADDRESS/" frontend/.env
    sed -i "s/VITE_STELLAR_CONTRACT_SELECTIVE_DISCLOSURE=.*/VITE_STELLAR_CONTRACT_SELECTIVE_DISCLOSURE=$SELECTIVE_DISCLOSURE_ADDRESS/" frontend/.env

    echo "Updated contract addresses in frontend environment"
else
    echo "Warning: Contract deployment file not found. Please update contract addresses manually."
fi

# Deploy backend
echo "Deploying backend..."
cd backend

if [[ "$ENVIRONMENT" == "production" ]]; then
    # Production deployment (would use Docker, Kubernetes, etc.)
    echo "Production deployment not implemented yet"
    # docker build -t decentralized-identity-backend .
    # docker push decentralized-identity-backend
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    # Staging deployment
    echo "Staging deployment not implemented yet"
else
    # Development - just start the server
    echo "Starting development server..."
    npm start &
fi
cd ..

# Deploy frontend
echo "Deploying frontend..."
cd frontend

if [[ "$ENVIRONMENT" == "production" ]]; then
    # Production deployment
    npm run build
    echo "Frontend built for production. Deploy to your hosting service."
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    # Staging deployment
    npm run build
    echo "Frontend built for staging. Deploy to your staging environment."
else
    # Development
    echo "Starting development server..."
    npm run dev &
fi
cd ..

# Health checks
echo "Performing health checks..."

# Wait for services to start
sleep 10

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "Backend health check passed"
else
    echo "Backend health check failed"
fi

# Check frontend health (if running)
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend health check passed"
else
    echo "Frontend health check failed (may not be running)"
fi

echo "Deployment completed!"
echo ""
echo "Deployment Summary:"
echo "- Environment: $ENVIRONMENT"
echo "- Network: $NETWORK"
echo "- Backend: http://localhost:3001"
echo "- Frontend: http://localhost:3000"
echo ""
echo "Next steps:"
echo "1. Verify all services are running correctly"
echo "2. Test the application functionality"
echo "3. Monitor logs for any issues"
echo ""
echo "For production deployments, ensure:"
echo "- All environment variables are properly configured"
echo "- SSL certificates are installed"
echo "- Database backups are configured"
echo "- Monitoring and alerting are set up"
