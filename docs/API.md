# API Documentation

## Overview

This document describes the REST API for the Decentralized Identity Platform. The API provides endpoints for identity management, passkey authentication, selective disclosure, and Stellar blockchain integration.

## Base URL

- Development: `http://localhost:3001`
- Production: `https://api.decentralized-identity.com`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error code",
  "message": "Human-readable error message"
}
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user with passkey authentication.

**Request Body:**
```json
{
  "credentialId": "string",
  "publicKey": "string",
  "authenticatorData": "string",
  "clientDataJSON": "string",
  "signature": "string",
  "displayName": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "jwt-token",
    "stellarAddress": "G..."
  }
}
```

#### POST /api/auth/passkey-login
Authenticate with passkey.

**Request Body:**
```json
{
  "credentialId": "string",
  "authenticatorData": "string",
  "clientDataJSON": "string",
  "signature": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

#### GET /api/auth/challenge
Generate a challenge for passkey authentication.

**Response:**
```json
{
  "success": true,
  "data": {
    "challenge": "base64-challenge",
    "timeout": 60000
  }
}
```

#### POST /api/auth/refresh
Refresh an existing JWT token.

**Request Body:**
```json
{
  "token": "jwt-token"
}
```

#### POST /api/auth/logout
Logout (client-side token removal).

### Identity Management

#### POST /api/identity/create
Create a new identity (protected endpoint).

**Request Body:**
```json
{
  "displayName": "string",
  "attributes": [
    {
      "name": "email",
      "value": "user@example.com",
      "type": "email",
      "encrypted": false
    }
  ]
}
```

#### GET /api/identity/:id
Get identity details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "identity-id",
    "publicKey": "public-key",
    "stellarAddress": "G...",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "attributes": [ ... ],
    "verifications": [ ... ]
  }
}
```

#### PUT /api/identity/:id
Update identity attributes.

**Request Body:**
```json
{
  "attributes": [
    {
      "id": "attribute-id",
      "value": "new-value",
      "encrypted": true
    }
  ]
}
```

#### GET /api/identity/:id/attributes
Get identity attributes.

#### GET /api/identity/:id/verifications
Get identity verifications.

### Passkey Management

#### POST /api/passkey/create
Create a new passkey credential.

**Request Body:**
```json
{
  "displayName": "string",
  "userId": "string"
}
```

#### GET /api/passkey/list
List user's passkey credentials.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "credential-id",
      "publicKey": "public-key",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### DELETE /api/passkey/:id
Delete a passkey credential.

### Selective Disclosure

#### POST /api/disclosure/request
Create a selective disclosure request.

**Request Body:**
```json
{
  "requestedAttributes": ["email", "name"],
  "purpose": "Identity verification for service access",
  "expiresAt": "2023-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Disclosure request created successfully",
  "data": {
    "id": "request-id",
    "requester": "user-id",
    "requestedAttributes": ["email", "name"],
    "purpose": "Identity verification for service access",
    "expiresAt": "2023-12-31T23:59:59.000Z",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/disclosure/respond
Respond to a selective disclosure request.

**Request Body:**
```json
{
  "requestId": "request-id",
  "disclosedAttributes": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "proofs": {
    "email": "proof-data",
    "name": "proof-data"
  },
  "signature": "signature-data"
}
```

#### GET /api/disclosure/request/:requestId
Get disclosure request details.

#### GET /api/disclosure/response/:requestId
Get disclosure response details.

#### GET /api/disclosure/requests
Get user's disclosure requests.

**Query Parameters:**
- `status`: Filter by status (pending, responded, expired)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### GET /api/disclosure/responses
Get user's disclosure responses.

#### POST /api/disclosure/revoke/:requestId
Revoke a disclosure response.

**Request Body:**
```json
{
  "reason": "User requested revocation"
}
```

#### POST /api/disclosure/verify-zk-proof
Verify a zero-knowledge proof.

**Request Body:**
```json
{
  "proof": "zk-proof-data",
  "publicInputs": ["input1", "input2"],
  "verificationKey": "verification-key"
}
```

#### GET /api/disclosure/stats
Get disclosure statistics.

### Stellar Integration

#### GET /api/stellar/balance
Get Stellar account balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "100.5",
    "asset": "XLM"
  }
}
```

#### POST /api/stellar/transaction
Create and submit a Stellar transaction.

**Request Body:**
```json
{
  "to": "G...",
  "amount": "10",
  "asset": "XLM",
  "memo": "Identity verification"
}
```

#### POST /api/stellar/contract-call
Call a smart contract on Stellar.

**Request Body:**
```json
{
  "contractId": "contract-id",
  "method": "method_name",
  "args": ["arg1", "arg2"]
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Authentication endpoints: 5 requests per 15 minutes
- Passkey endpoints: 3 requests per 5 minutes  
- General endpoints: 100 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Webhooks

The platform supports webhooks for real-time notifications:

### Identity Events
- `identity.created`: New identity created
- `identity.verified`: Identity attribute verified
- `identity.updated`: Identity attributes updated

### Disclosure Events
- `disclosure.requested`: New disclosure request
- `disclosure.responded`: Disclosure response provided
- `disclosure.revoked`: Disclosure response revoked

### Webhook Configuration
Set webhook URL in environment variables:
```
WEBHOOK_URL=https://your-service.com/webhook
WEBHOOK_SECRET=your-webhook-secret
```

## SDKs

### JavaScript/TypeScript
```bash
npm install @decentralized-identity/sdk
```

```typescript
import { IdentitySDK } from '@decentralized-identity/sdk'

const sdk = new IdentitySDK({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your-api-key'
})

// Create identity
const identity = await sdk.identity.create({
  displayName: 'John Doe',
  attributes: [...]
})

// Create disclosure request
const request = await sdk.disclosure.createRequest({
  requestedAttributes: ['email', 'name'],
  purpose: 'Service verification'
})
```

### Python
```bash
pip install decentralized-identity-sdk
```

```python
from decentralized_identity import IdentitySDK

sdk = IdentitySDK(
    api_url='http://localhost:3001',
    api_key='your-api-key'
)

# Create identity
identity = sdk.identity.create({
    'display_name': 'John Doe',
    'attributes': [...]
})
```

## Testing

### Test Environment
- URL: `http://localhost:3001`
- Network: Stellar Testnet
- Database: Test MongoDB instance

### Test Credentials
- Test User: `test@example.com`
- Test Passkey: Use WebAuthn test tools

### API Testing
Use the provided Postman collection or import the OpenAPI specification.

## Support

For API support and questions:
- Documentation: https://docs.decentralized-identity.com
- GitHub Issues: https://github.com/decentralized-identity/platform/issues
- Email: support@decentralized-identity.com
