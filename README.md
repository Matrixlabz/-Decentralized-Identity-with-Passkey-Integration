# Decentralized Identity with Passkey Integration

A self-sovereign identity platform using Stellar's Secp256r1 passkey support. Users control their identity with biometric authentication, with selective disclosure for different services.

## Architecture Overview

```
decentralized-identity-passkey/
|--------------------------------------------------------------------------
| frontend/          - React application with modern UI (TailwindCSS, shadcn/ui)
| backend/           - Node.js server with Stellar integration
| smart-contracts/   - Stellar smart contracts for identity management
| shared/            - Shared types and utilities
| docs/              - Documentation and API specs
| scripts/           - Deployment and utility scripts
|--------------------------------------------------------------------------
```

## Key Features

- **Biometric Authentication**: Passkey support with Secp256r1 on Stellar
- **Self-Sovereign Identity**: Users maintain full control over their identity data
- **Selective Disclosure**: Granular control over what information to share
- **Stellar Integration**: Leverages Stellar's robust blockchain infrastructure
- **Modern UI**: Beautiful, responsive interface using TailwindCSS and shadcn/ui

## Technology Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- shadcn/ui components
- WebAuthn API for passkey authentication
- Stellar SDK for blockchain interactions

### Backend
- Node.js with Express
- TypeScript
- Stellar SDK
- JWT for session management
- MongoDB for identity metadata storage

### Smart Contracts (Stellar)
- Soroban smart contracts
- Identity registry
- Attribute verification
- Selective disclosure mechanisms

## Quick Start

1. **Install dependencies**
   ```bash
   npm run setup
   ```

2. **Start development servers**
   ```bash
   npm run dev
   ```

3. **Deploy smart contracts**
   ```bash
   npm run deploy:contracts
   ```

## Project Structure

### Frontend (`/frontend`)
- `/src/components` - Reusable UI components
- `/src/pages` - Application pages
- `/src/hooks` - Custom React hooks
- `/src/services` - API and blockchain services
- `/src/types` - TypeScript type definitions

### Backend (`/backend`)
- `/src/controllers` - API route handlers
- `/src/services` - Business logic and Stellar integration
- `/src/models` - Database models
- `/src/middleware` - Authentication and validation
- `/src/utils` - Utility functions

### Smart Contracts (`/smart-contracts`)
- `/contracts` - Soroban contract source files
- `/tests` - Contract test suites
- `/deployment` - Deployment scripts and configurations

## Security Considerations

- Passkey credentials never leave the user's device
- All identity data is encrypted on-chain
- Selective disclosure prevents oversharing
- Zero-knowledge proofs for verification without data exposure

## License

MIT License - see LICENSE file for details
