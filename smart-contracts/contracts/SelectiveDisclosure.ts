import { Contract, Address, xdr, nativeToScVal } from '@stellar/stellar-sdk';

/**
 * TypeScript client wrapper for Soroban SelectiveDisclosure contract.
 */
export class SelectiveDisclosure extends Contract {
  constructor(address: string) {
    super(address);
  }

  /**
   * Initialize the selective disclosure contract
   */
  initialize(owner: string): xdr.Operation {
    return this.call('initialize', Address.fromString(owner).toScVal());
  }

  /**
   * Create a selective disclosure request
   */
  createRequest(
    requestId: string,
    requesterAddress: string,
    requestedAttributes: string[],
    purpose: string,
    expiresAt: number
  ): xdr.Operation {
    return this.call(
      'create_request',
      nativeToScVal(requestId, { type: 'string' }),
      Address.fromString(requesterAddress).toScVal(),
      nativeToScVal(requestedAttributes, { type: 'vec' }),
      nativeToScVal(purpose, { type: 'string' }),
      nativeToScVal(expiresAt, { type: 'u64' })
    );
  }

  /**
   * Respond to a request with cryptographic zero-knowledge commitment root and proof
   */
  respondToRequest(
    requestId: string,
    identityId: string,
    responderAddress: string,
    commitmentRoot32: Buffer | Uint8Array,
    proofBytes: Buffer | Uint8Array,
    disclosedAttributeSymbols: string[]
  ): xdr.Operation {
    return this.call(
      'respond_to_request',
      nativeToScVal(requestId, { type: 'string' }),
      nativeToScVal(identityId, { type: 'string' }),
      Address.fromString(responderAddress).toScVal(),
      nativeToScVal(commitmentRoot32, { type: 'bytes' }),
      nativeToScVal(proofBytes, { type: 'bytes' }),
      nativeToScVal(disclosedAttributeSymbols, { type: 'vec' })
    );
  }

  /**
   * Revoke a disclosure response
   */
  revokeResponse(
    requestId: string,
    callerAddress: string,
    reason: string
  ): xdr.Operation {
    return this.call(
      'revoke_response',
      nativeToScVal(requestId, { type: 'string' }),
      Address.fromString(callerAddress).toScVal(),
      nativeToScVal(reason, { type: 'string' })
    );
  }

  /**
   * Pause contract execution
   */
  pause(): xdr.Operation {
    return this.call('pause');
  }

  /**
   * Unpause contract execution
   */
  unpause(): xdr.Operation {
    return this.call('unpause');
  }
}
