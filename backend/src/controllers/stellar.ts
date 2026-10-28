import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '@/middleware/errorHandler';
import { StellarService } from '@/services/stellar';
import { logger } from '@/utils/logger';

const router = Router();
const stellarService = new StellarService();

// Generate an ephemeral keypair
router.get('/keypair/generate', asyncHandler(async (req: Request, res: Response) => {
  const kp = stellarService.generateKeypair();
  res.json({
    success: true,
    data: {
      publicKey: kp.publicKey(),
      secretKey: kp.secret(),
    },
  });
}));

// Query on-chain account details
router.get('/account/:address', asyncHandler(async (req: Request, res: Response) => {
  const address = req.params.address;
  if (!stellarService.isValidAddress(address)) {
    throw createError('Invalid Stellar public key format', 400);
  }

  const account = await stellarService.getAccount(address);
  res.json({
    success: true,
    data: account,
  });
}));

// Fund testnet account via Friendbot
router.post('/fund', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.body;
  if (!address || !stellarService.isValidAddress(address)) {
    throw createError('Valid Stellar address is required', 400);
  }

  const funded = await stellarService.fundTestnetAccount(address);
  if (!funded) {
    throw createError('Friendbot funding request failed', 502);
  }

  res.json({
    success: true,
    message: 'Testnet account successfully funded with 10,000 XLM',
    data: { address },
  });
}));

// Verify message signature
router.post('/verify-signature', asyncHandler(async (req: Request, res: Response) => {
  const { message, signature, publicKey } = req.body;
  if (!message || !signature || !publicKey) {
    throw createError('Missing message, signature, or publicKey', 400);
  }

  const isValid = stellarService.verifySignature(message, signature, publicKey);
  res.json({
    success: true,
    data: { isValid },
  });
}));

export default router;
