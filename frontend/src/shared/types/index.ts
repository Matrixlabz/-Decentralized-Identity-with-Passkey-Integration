export interface Identity {
  id: string;
  publicKey: string;
  stellarAddress: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
  attributes: IdentityAttribute[];
  verifications: Verification[];
  didDocument?: DIDDocument;
}

export interface IdentityAttribute {
  id: string;
  name: string;
  value: string;
  type: AttributeType;
  encrypted: boolean;
  verified: boolean;
  verificationId?: string;
  createdAt: Date;
}

export enum AttributeType {
  EMAIL = 'email',
  PHONE = 'phone',
  NAME = 'name',
  DATE_OF_BIRTH = 'date_of_birth',
  ADDRESS = 'address',
  GOVERNMENT_ID = 'government_id',
  EDUCATION = 'education',
  EMPLOYMENT = 'employment',
  CUSTOM = 'custom'
}

export interface Verification {
  id: string;
  attributeId: string;
  verifier: string;
  verificationMethod: VerificationMethod;
  verifiedAt: Date;
  expiresAt?: Date;
  proof: string;
  metadata?: Record<string, any>;
}

export enum VerificationMethod {
  PASSKEY = 'passkey',
  DOCUMENT = 'document',
  BIOMETRIC = 'biometric',
  THIRD_PARTY = 'third_party',
  ZERO_KNOWLEDGE = 'zero_knowledge'
}

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  algorithm: string;
  userHandle?: string;
  transports?: string[];
  createdAt?: Date;
  counter?: number;
}

export interface StoredCredential {
  credentialId: string;
  publicKey: string;
  userId: string;
  authenticatorData: string;
  clientDataJSON: string;
  counter?: number;
  transports?: string[];
  createdAt: Date;
}

export interface SelectiveDisclosureRequest {
  id: string;
  requester: string;
  requestedAttributes: string[];
  purpose: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface SelectiveDisclosureResponse {
  requestId: string;
  identityId: string;
  commitmentRoot: string;
  disclosedAttributes: Record<string, string>;
  proofs: Record<string, string>;
  signature: string;
  timestamp: Date;
  revoked?: boolean;
}

export interface StellarContract {
  contractId: string;
  network: 'mainnet' | 'testnet' | 'standalone';
  address: string;
  deployedAt: Date;
}

export interface IdentityContractData {
  owner: string;
  attributesHash: string;
  verificationHash: string;
  nonce: number;
}

export interface ZKProof {
  proof: string;
  publicInputs: string[];
  verificationKey: string;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
    publicKeyJwk?: Record<string, any>;
  }>;
  authentication: string[];
  assertionMethod: string[];
}

export interface WebAuthnChallengeSession {
  challenge: string;
  userId?: string;
  createdAt: number;
  expiresAt: number;
}
