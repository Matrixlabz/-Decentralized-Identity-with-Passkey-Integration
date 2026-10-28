import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { IdentityService } from '@/services/identity';
import { createError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const router = Router();
const identityService = new IdentityService();

// Retrieve identity by ID or Stellar address
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const identity = await identityService.getIdentity(req.params.id);
  if (!identity) {
    throw createError('Identity not found', 404);
  }

  res.json({
    success: true,
    data: identity,
  });
}));

// Retrieve W3C compliant DID document
router.get('/:id/did', asyncHandler(async (req: Request, res: Response) => {
  const identity = await identityService.getIdentity(req.params.id);
  if (!identity) {
    throw createError('Identity not found', 404);
  }

  res.json(identity.didDocument);
}));

// Add attribute to identity
router.post('/:id/attributes', asyncHandler(async (req: Request, res: Response) => {
  const { name, value, type, encrypted } = req.body;
  if (!name || !value || !type) {
    throw createError('Missing name, value, or type for attribute', 400);
  }

  const updatedIdentity = await identityService.addAttribute(req.params.id, {
    name,
    value,
    type,
    encrypted: Boolean(encrypted),
    verified: false,
  });

  res.status(201).json({
    success: true,
    message: 'Attribute successfully added',
    data: updatedIdentity,
  });
}));

// Add third-party verification to an attribute
router.post('/:id/verifications', asyncHandler(async (req: Request, res: Response) => {
  const { attributeId, verifier, verificationMethod, proof, expiresAt, metadata } = req.body;
  if (!attributeId || !verifier || !verificationMethod || !proof) {
    throw createError('Missing required verification fields', 400);
  }

  const updatedIdentity = await identityService.addVerification(req.params.id, {
    attributeId,
    verifier,
    verificationMethod,
    proof,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    metadata,
  });

  res.status(201).json({
    success: true,
    message: 'Verification attestation successfully recorded',
    data: updatedIdentity,
  });
}));

// Revoke a verification
router.delete('/:id/verifications/:verificationId', asyncHandler(async (req: Request, res: Response) => {
  const updatedIdentity = await identityService.revokeVerification(
    req.params.id,
    req.params.verificationId
  );

  res.json({
    success: true,
    message: 'Verification attestation revoked',
    data: updatedIdentity,
  });
}));

// Compute attributes digest
router.get('/:id/attributes-hash', asyncHandler(async (req: Request, res: Response) => {
  const identity = await identityService.getIdentity(req.params.id);
  if (!identity) {
    throw createError('Identity not found', 404);
  }

  const hash = identityService.computeAttributesHash(identity.attributes);
  res.json({
    success: true,
    data: {
      attributesHash: hash,
    },
  });
}));

export default router;
