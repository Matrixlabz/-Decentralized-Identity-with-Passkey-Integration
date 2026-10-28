import { Contract, Address, xdr, nativeToScVal } from '@stellar/stellar-sdk';

/**
 * TypeScript client wrapper for Soroban IdentityRegistry contract.
 */
export class IdentityRegistry extends Contract {
  constructor(address: string) {
    super(address);
  }

  /**
   * Initialize the contract with designated owner
   */
  initialize(owner: string): xdr.Operation {
    return this.call('initialize', Address.fromString(owner).toScVal());
  }

  /**
   * Register a new decentralized identity with Secp256r1 public key and initial attributes hash
   */
  registerIdentity(
    identityId: string,
    publicKeyBytes65: Buffer | Uint8Array,
    stellarAddress: string,
    attributesHash32: Buffer | Uint8Array
  ): xdr.Operation {
    return this.call(
      'register_identity',
      nativeToScVal(identityId, { type: 'string' }),
      nativeToScVal(publicKeyBytes65, { type: 'bytes' }),
      Address.fromString(stellarAddress).toScVal(),
      nativeToScVal(attributesHash32, { type: 'bytes' })
    );
  }

  /**
   * Update identity attributes hash
   */
  updateAttributes(
    identityId: string,
    newAttributesHash32: Buffer | Uint8Array
  ): xdr.Operation {
    return this.call(
      'update_attributes',
      nativeToScVal(identityId, { type: 'string' }),
      nativeToScVal(newAttributesHash32, { type: 'bytes' })
    );
  }

  /**
   * Add a third-party verification attestation for an attribute
   */
  addVerification(
    identityId: string,
    verificationId: string,
    attributeId: string,
    verifierAddress: string,
    methodSymbol: string,
    proofBytes: Buffer | Uint8Array,
    expiresAt?: number
  ): xdr.Operation {
    return this.call(
      'add_verification',
      nativeToScVal(identityId, { type: 'string' }),
      nativeToScVal(verificationId, { type: 'string' }),
      nativeToScVal(attributeId, { type: 'string' }),
      Address.fromString(verifierAddress).toScVal(),
      nativeToScVal(methodSymbol, { type: 'symbol' }),
      nativeToScVal(proofBytes, { type: 'bytes' }),
      expiresAt ? nativeToScVal(expiresAt, { type: 'u64' }) : nativeToScVal(null)
    );
  }

  /**
   * Revoke an existing attribute verification
   */
  revokeVerification(
    identityId: string,
    verificationId: string,
    callerAddress: string
  ): xdr.Operation {
    return this.call(
      'revoke_verification',
      nativeToScVal(identityId, { type: 'string' }),
      nativeToScVal(verificationId, { type: 'string' }),
      Address.fromString(callerAddress).toScVal()
    );
  }

  /**
   * Transfer administrative ownership
   */
  transferOwnership(newOwner: string): xdr.Operation {
    return this.call('transfer_ownership', Address.fromString(newOwner).toScVal());
  }

  /**
   * Pause contract
   */
  pause(): xdr.Operation {
    return this.call('pause');
  }

  /**
   * Unpause contract
   */
  unpause(): xdr.Operation {
    return this.call('unpause');
  }
}
