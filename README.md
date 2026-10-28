# Decentralized Identity with Passkey Integration (Stellar Soroban)

An enterprise-grade, self-sovereign decentralized identity (DID) platform anchored to the **Stellar Network** via **Soroban Smart Contracts** and authenticated using **WebAuthn Biometric Passkeys (Secp256r1)**.

Eliminates seed phrases, insecure passwords, and centralized identity intermediaries while offering cryptographic selective disclosure and zero-knowledge verifiable credentials.

---

## 🌟 Key Features

- **Biometric Passkey Authentication**: Hardware-backed WebAuthn registration and authentication leveraging modern device enclaves (Touch ID, Face ID, Windows Hello) with RFC 8809 authenticator flags.
- **Soroban Rust WASM Smart Contracts**: Fully verified, high-performance contracts running on Stellar Soroban:
  - `IdentityRegistry`: Manages on-chain DID records, attribute hashes, and third-party verification credentials.
  - `SelectiveDisclosure`: Facilitates privacy-preserving disclosure queries and zero-knowledge commitment roots.
- **W3C DID v1.0 Standard Compliance**: Dynamic generation of `did:passkey` DID documents containing public keys, authentication suites, and service endpoints.
- **Client-Side AES-256-GCM Encryption**: Identity claims and private metadata are encrypted with PBKDF2 key derivation and random IVs before leaving user devices.
- **Selective Disclosure & Merkle Roots**: Disclose only required claims (e.g., "Over 21" or "Accredited Investor") using SHA-256 commitments without revealing underlying private attributes.
- **Stellar Friendbot Testnet Integration**: Seamless automated provisioning and testnet XLM funding for zero-friction user onboarding.
- **Glassmorphic Dark Interface**: Responsive, modern web interface built with React 18, Tailwind CSS, Lucide icons, and stateful hooks.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / USER DEVICE                            │
│  ┌───────────────────────┐                 ┌────────────────────────┐  │
│  │   Hardware Passkey    │                 │   React 18 Frontend    │  │
│  │  (Secp256r1 / Enclave)│<--- WebAuthn ---│   (Vite + Tailwind)    │  │
│  └───────────────────────┘                 └───────────┬────────────┘  │
└────────────────────────────────────────────────────────┼───────────────┘
                                                         │ HTTPS / JSON-RPC
┌────────────────────────────────────────────────────────▼───────────────┐
│                           BACKEND GATEWAY                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Express + TypeScript API Server                                  │  │
│  │ • Passkey Challenge Replay Protection (5-min TTL)                │  │
│  │ • W3C DID Document Resolver (did:passkey)                        │  │
│  │ • AES-256 Encryption & PBKDF2 Vault Storage                      │  │
│  │ • Stellar Friendbot Auto-Funding Proxy                           │  │
│  └──────────────────┬───────────────────────────┬───────────────────┘  │
│                     │                           │                      │
│             MongoDB Document Store       Stellar SDK & RPC             │
└─────────────────────┼───────────────────────────┼──────────────────────┘
                      │                           │
┌─────────────────────▼───────────────────────────▼──────────────────────┐
│                    STELLAR SOROBAN SMART CONTRACTS                     │
│  ┌─────────────────────────────────┐   ┌────────────────────────────┐  │
│  │     IdentityRegistry (WASM)     │   │ SelectiveDisclosure (WASM) │  │
│  │ • Register DID & Attributes Hash│   │ • Create Disclosure Query  │  │
│  │ • Add & Revoke Verifications    │   │ • Submit Merkle Proof Root │  │
│  │ • Pause / Ownership Controls    │   │ • Query Active Responses   │  │
│  └─────────────────────────────────┘   └────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── smart-contracts/               # Soroban Rust WASM Contracts
│   ├── Cargo.toml                 # Workspace manifest
│   ├── contracts/
│   │   ├── identity_registry/     # Identity registry smart contract
│   │   │   ├── src/lib.rs         # Storage, methods, events
│   │   │   └── src/test.rs        # 7 comprehensive unit tests
│   │   └── selective_disclosure/  # Selective disclosure smart contract
│   │       ├── src/lib.rs         # Request/response management
│   │       └── src/test.rs        # 3 comprehensive unit tests
│   ├── contracts/IdentityRegistry.ts    # TypeScript Soroban contract wrapper
│   ├── contracts/SelectiveDisclosure.ts # TypeScript Soroban contract wrapper
│   └── scripts/deploy.ts          # Automated Soroban deployment script
├── shared/                        # Cryptographic Core & Universal Types
│   ├── src/types/index.ts         # W3C DID types, Passkey credentials, claims
│   └── src/utils/index.ts         # StellarUtils, PasskeyUtils, EncryptionUtils
├── backend/                       # Express Node.js Backend Server
│   ├── src/controllers/           # Auth, Identity, Passkey, Disclosure, Stellar
│   ├── src/services/              # Blockchain, cryptographic, and passkey logic
│   ├── src/middleware/            # JWT auth, rate limiting, error handlers
│   └── src/models/                # MongoDB identity and credential schemas
├── frontend/                      # React 18 Single-Page Application
│   ├── src/components/            # Layout, Toaster, UI design tokens
│   ├── src/pages/                 # Register, Login, Dashboard, Identity, Attributes,
│   │                              # Verifications, Disclosure, Settings
│   └── src/store/                 # Zustand authentication and session store
├── docs/                          # Comprehensive Documentation
│   ├── API.md                     # Complete REST API specifications
│   └── ARCHITECTURE.md            # Deep architectural blueprints & security model
└── scripts/                       # Setup and automated deployment scripts
```

---

## 🧪 Smart Contracts Testing

The Soroban contracts are written in `#![no_std]` Rust targeting WebAssembly. All unit tests run against Soroban test utilities and pass cleanly:

```bash
cd smart-contracts
cargo test -- --nocapture
```

### Identity Registry Test Suite (7/7 Passed):
- `test_initialize_and_owner`: Verifies contract initialization and owner assignment.
- `test_register_and_get_identity`: Validates DID record creation and retrieval.
- `test_update_attributes`: Tests attribute hash updates with authorization checks.
- `test_add_and_revoke_verification`: Validates third-party attestation lifecycles.
- `test_reinitialization_fails`: Ensures contract cannot be reinitialized by unauthorized parties.
- `test_duplicate_registration_fails`: Guards against duplicate DID collision.
- `test_pause_guard`: Validates emergency pause circuitry.

### Selective Disclosure Test Suite (3/3 Passed):
- `test_initialize_and_owner`: Tests initialization and ownership verification.
- `test_create_and_respond_request`: Tests disclosure request lifecycle and cryptographic response storage.
- `test_expired_request_cannot_be_responded`: Confirms ledger timestamp expiration guards.

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- **Rust** 1.74+ and `wasm32-unknown-unknown` target:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- **Stellar CLI** (Soroban CLI)

### 1. Installation
Clone the repository and install workspace dependencies:
```bash
git clone https://github.com/Matrixlabz/-Decentralized-Identity-with-Passkey-Integration.git
cd -Decentralized-Identity-with-Passkey-Integration
npm install
```

### 2. Environment Configuration
Copy environment templates:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key environment parameters:
```env
# Backend
PORT=3001
MONGODB_URI=mongodb://localhost:27017/decentralized-identity
JWT_SECRET=production-grade-jwt-secret-key
STELLAR_NETWORK=testnet

# Frontend
VITE_API_URL=http://localhost:3001
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_CONTRACT_IDENTITY_REGISTRY=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
VITE_STELLAR_CONTRACT_SELECTIVE_DISCLOSURE=CBPDNPWCH2KZZKGY3XN2I4RZZM4WCEZ47Z2Q2RMCVVZTRSQVU7HHGCZ5
```

### 3. Build & Run
Run both backend and frontend development servers concurrently:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API Gateway**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`

---

## 🔒 Security Architecture

1. **Hardware-Backed Private Keys**: Secp256r1 passkey credentials reside strictly inside the device's hardware Secure Enclave. Raw private keys never touch client JavaScript, backend servers, or blockchain ledgers.
2. **Replay & Session Protection**: Every passkey assertion validates a single-use, 32-byte cryptographically secure challenge with a 5-minute strict TTL.
3. **Zero-Knowledge Selective Disclosure**: Merkle commitment roots allow verifiers to mathematically validate identity criteria without acquiring sensitive personal data.
4. **Emergency Pause Circuit Breaker**: Soroban contracts include administrator pause mechanisms to freeze registry mutations if an anomaly is detected.

---

## 📜 License

Licensed under the [MIT License](./LICENSE).
