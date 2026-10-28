import { IdentityModel } from '@/models/Identity';
import {
  Identity,
  IdentityAttribute,
  Verification,
  DIDDocument,
  StellarUtils,
} from '@decentralized-identity/shared';
import { logger } from '@/utils/logger';
import { createError } from '@/middleware/errorHandler';

interface CreateIdentityParams {
  id: string;
  publicKey: string;
  stellarAddress: string;
  displayName?: string;
}

export class IdentityService {
  /**
   * Create a new decentralized identity document in MongoDB.
   */
  async createIdentity(params: CreateIdentityParams): Promise<Identity> {
    try {
      const existing = await IdentityModel.findOne({
        $or: [{ id: params.id }, { stellarAddress: params.stellarAddress }],
      });

      if (existing) {
        throw createError('Identity already exists for this ID or Stellar address', 400);
      }

      const didDocument: DIDDocument = this.generateDIDDocument(params.stellarAddress, params.publicKey);

      const identityDoc = await IdentityModel.create({
        id: params.id,
        publicKey: params.publicKey,
        stellarAddress: params.stellarAddress,
        attributes: [],
        verifications: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info(`Created decentralized identity: ${params.id} (${params.stellarAddress})`);
      const identityObj = identityDoc.toJSON() as unknown as Identity;
      identityObj.didDocument = didDocument;
      return identityObj;
    } catch (err) {
      logger.error('Failed to create identity:', err);
      throw err;
    }
  }

  /**
   * Retrieve identity by ID or Stellar address.
   */
  async getIdentity(idOrAddress: string): Promise<Identity | null> {
    const doc = await IdentityModel.findOne({
      $or: [{ id: idOrAddress }, { stellarAddress: idOrAddress }, { publicKey: idOrAddress }],
    });

    if (!doc) {
      return null;
    }

    const identity = doc.toJSON() as unknown as Identity;
    identity.didDocument = this.generateDIDDocument(identity.stellarAddress, identity.publicKey);
    return identity;
  }

  /**
   * Add or update an identity attribute.
   */
  async addAttribute(
    identityId: string,
    attribute: Omit<IdentityAttribute, 'id' | 'createdAt'>
  ): Promise<Identity> {
    const doc = await IdentityModel.findOne({ id: identityId });
    if (!doc) {
      throw createError('Identity not found', 404);
    }

    const attributeId = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newAttr: IdentityAttribute = {
      ...attribute,
      id: attributeId,
      createdAt: new Date(),
    };

    doc.attributes.push(newAttr);
    doc.updatedAt = new Date();
    await doc.save();

    logger.info(`Added attribute ${attribute.name} to identity ${identityId}`);
    return doc.toJSON() as unknown as Identity;
  }

  /**
   * Add a third-party verification to an identity attribute.
   */
  async addVerification(
    identityId: string,
    verification: Omit<Verification, 'id' | 'verifiedAt'>
  ): Promise<Identity> {
    const doc = await IdentityModel.findOne({ id: identityId });
    if (!doc) {
      throw createError('Identity not found', 404);
    }

    const verificationId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newVer: Verification = {
      ...verification,
      id: verificationId,
      verifiedAt: new Date(),
    };

    // Mark matching attribute as verified
    const attrIndex = doc.attributes.findIndex((a) => a.id === verification.attributeId);
    if (attrIndex !== -1) {
      doc.attributes[attrIndex].verified = true;
      doc.attributes[attrIndex].verificationId = verificationId;
    }

    doc.verifications.push(newVer);
    doc.updatedAt = new Date();
    await doc.save();

    logger.info(`Added verification ${verificationId} for attribute ${verification.attributeId}`);
    return doc.toJSON() as unknown as Identity;
  }

  /**
   * Revoke a verification.
   */
  async revokeVerification(identityId: string, verificationId: string): Promise<Identity> {
    const doc = await IdentityModel.findOne({ id: identityId });
    if (!doc) {
      throw createError('Identity not found', 404);
    }

    const verIndex = doc.verifications.findIndex((v) => v.id === verificationId);
    if (verIndex === -1) {
      throw createError('Verification not found', 404);
    }

    const [removedVer] = doc.verifications.splice(verIndex, 1);

    // Unmark attribute verified status
    const attrIndex = doc.attributes.findIndex((a) => a.id === removedVer.attributeId);
    if (attrIndex !== -1) {
      doc.attributes[attrIndex].verified = false;
      delete doc.attributes[attrIndex].verificationId;
    }

    doc.updatedAt = new Date();
    await doc.save();

    logger.info(`Revoked verification ${verificationId} from identity ${identityId}`);
    return doc.toJSON() as unknown as Identity;
  }

  /**
   * Calculate SHA-256 Merkle/digest root of all current verified attributes.
   */
  computeAttributesHash(attributes: IdentityAttribute[]): string {
    const sorted = [...attributes].sort((a, b) => a.name.localeCompare(b.name));
    const payload = sorted.map((a) => `${a.name}:${a.value}`).join(';');
    return StellarUtils.hashDataSync(payload);
  }

  /**
   * Generate W3C compliant DID document for a Stellar identity.
   */
  generateDIDDocument(stellarAddress: string, publicKey: string): DIDDocument {
    const did = `did:stellar:${stellarAddress}`;
    const keyId = `${did}#key-1`;

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      id: did,
      verificationMethod: [
        {
          id: keyId,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: publicKey,
        },
      ],
      authentication: [keyId],
      assertionMethod: [keyId],
    };
  }
}
