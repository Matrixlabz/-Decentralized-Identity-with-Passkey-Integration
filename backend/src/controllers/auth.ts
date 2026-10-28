import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { PasskeyService } from '@/services/passkey';
import { IdentityService } from '@/services/identity';
import { StellarService } from '@/services/stellar';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';

const router = Router();
const passkeyService = new PasskeyService();
const identityService = new IdentityService();
const stellarService = new StellarService();

const JWT_SECRET = process.env.JWT_SECRET || 'equinox-passkey-identity-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

// Register new user with passkey
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const {
    credentialId,
    publicKey,
    authenticatorData,
    clientDataJSON,
    signature,
    displayName,
    userId,
    customStellarAddress,
  } = req.body;

  if (!credentialId || !publicKey || !authenticatorData || !clientDataJSON) {
    throw createError('Missing required registration fields', 400);
  }

  try {
    const isValidPasskey = await passkeyService.verifyRegistration({
      credentialId,
      publicKey,
      authenticatorData,
      clientDataJSON,
      signature,
    });

    if (!isValidPasskey && process.env.NODE_ENV === 'production') {
      throw createError('Invalid passkey registration', 400);
    }

    // Use custom Stellar address or generate new keypair
    let stellarAddress = customStellarAddress;
    let secretKey: string | undefined;

    if (!stellarAddress) {
      const stellarKeypair = stellarService.generateKeypair();
      stellarAddress = stellarKeypair.publicKey();
      secretKey = stellarKeypair.secret();
    }

    const identityId = userId || `did:stellar:${stellarAddress}`;
    const identity = await identityService.createIdentity({
      id: identityId,
      publicKey,
      stellarAddress,
      displayName,
    });

    await passkeyService.storeCredential({
      credentialId,
      publicKey,
      userId: identity.id,
      authenticatorData,
      clientDataJSON,
    });

    const token = generateToken(identity.id);
    logger.info(`User registered successfully: ${identity.id}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: identity,
        token,
        stellarAddress,
        secretKey, // Returned once upon registration for self-custody backup
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
}));

// Login with passkey
router.post('/passkey-login', asyncHandler(async (req: Request, res: Response) => {
  const {
    credentialId,
    authenticatorData,
    clientDataJSON,
    signature,
  } = req.body;

  if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
    throw createError('Missing required login fields', 400);
  }

  try {
    const authResult = await passkeyService.verifyAuthentication({
      credentialId,
      authenticatorData,
      clientDataJSON,
      signature,
    });

    if (!authResult.isValid) {
      throw createError('Invalid passkey authentication', 401);
    }

    const credential = passkeyService.getCredential(credentialId);
    const identityId = credential?.userId;

    const identity = identityId
      ? await identityService.getIdentity(identityId)
      : await identityService.getIdentity(authResult.publicKey || '');

    if (!identity) {
      throw createError('Identity not found for this passkey', 404);
    }

    const token = generateToken(identity.id);
    logger.info(`User logged in successfully: ${identity.id}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: identity,
        token,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
}));

// Generate challenge for passkey authentication
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

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    throw createError('Token is required', 400);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const identity = await identityService.getIdentity(decoded.userId);

    if (!identity) {
      throw createError('Identity not found', 404);
    }

    const newToken = generateToken(identity.id);
    res.json({
      success: true,
      data: {
        token: newToken,
        user: identity,
      },
    });
  } catch (error) {
    throw createError('Invalid token', 401);
  }
}));

export default router;
