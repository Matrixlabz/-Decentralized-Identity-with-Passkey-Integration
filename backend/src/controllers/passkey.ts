import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { PasskeyService } from '@/services/passkey';
import { logger } from '@/utils/logger';

const router = Router();
const passkeyService = new PasskeyService();

// Issue a cryptographically fresh challenge with 5-minute TTL
router.get('/challenge', asyncHandler(async (req: Request, res: Response) => {
  const challenge = passkeyService.generateChallenge();
  res.json({
    success: true,
    data: {
      challenge,
      timeout: 60000,
    },
  });
}));

// Verify passkey registration
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { credentialId, publicKey, authenticatorData, clientDataJSON, signature, userId } = req.body;
  if (!credentialId || !publicKey || !authenticatorData || !clientDataJSON) {
    throw createError('Missing required registration parameters', 400);
  }

  const isValid = await passkeyService.verifyRegistration({
    credentialId,
    publicKey,
    authenticatorData,
    clientDataJSON,
    signature,
  });

  if (!isValid) {
    throw createError('Invalid passkey registration payload or expired challenge', 400);
  }

  if (userId) {
    await passkeyService.storeCredential({
      credentialId,
      publicKey,
      authenticatorData,
      clientDataJSON,
      userId,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Passkey credential enrolled successfully',
    data: { credentialId },
  });
}));

// Verify passkey authentication assertion
router.post('/authenticate', asyncHandler(async (req: Request, res: Response) => {
  const { credentialId, authenticatorData, clientDataJSON, signature } = req.body;
  if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
    throw createError('Missing required authentication parameters', 400);
  }

  const result = await passkeyService.verifyAuthentication({
    credentialId,
    authenticatorData,
    clientDataJSON,
    signature,
  });

  if (!result.isValid) {
    throw createError('Passkey authentication assertion failed', 401);
  }

  res.json({
    success: true,
    message: 'Passkey authenticated successfully',
    data: {
      credentialId,
      publicKey: result.publicKey,
    },
  });
}));

// List credentials for a user
router.get('/credentials/:userId', asyncHandler(async (req: Request, res: Response) => {
  const credentials = passkeyService.getCredentialsByUserId(req.params.userId);
  res.json({
    success: true,
    data: credentials.map((c) => ({
      credentialId: c.credentialId,
      createdAt: c.createdAt,
    })),
  });
}));

// Revoke a passkey credential
router.delete('/credentials/:credentialId', asyncHandler(async (req: Request, res: Response) => {
  const deleted = passkeyService.deleteCredential(req.params.credentialId);
  if (!deleted) {
    throw createError('Credential not found', 404);
  }

  res.json({
    success: true,
    message: 'Credential revoked',
  });
}));

export default router;
