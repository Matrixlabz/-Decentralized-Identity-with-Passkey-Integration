import { Router, Request, Response, NextFunction } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { PasskeyService } from '@/services/passkey'
import { IdentityService } from '@/services/identity'
import { StellarService } from '@/services/stellar'
import { createError } from '@/middleware/errorHandler'
import jwt from 'jsonwebtoken'
import { logger } from '@/utils/logger'

const router = Router()
const passkeyService = new PasskeyService()
const identityService = new IdentityService()
const stellarService = new StellarService()

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

interface AuthRequest extends Request {
  user?: any
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
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
    userId 
  } = req.body

  if (!credentialId || !publicKey || !authenticatorData || !clientDataJSON || !signature) {
    throw createError('Missing required fields', 400)
  }

  try {
    // Verify passkey registration
    const isValidPasskey = await passkeyService.verifyRegistration({
      credentialId,
      publicKey,
      authenticatorData,
      clientDataJSON,
      signature,
    })

    if (!isValidPasskey) {
      throw createError('Invalid passkey registration', 400)
    }

    // Generate Stellar keypair
    const stellarKeypair = stellarService.generateKeypair()
    
    // Create identity
    const identity = await identityService.createIdentity({
      id: userId || `identity_${Date.now()}`,
      publicKey,
      stellarAddress: stellarKeypair.publicKey(),
      displayName,
    })

    // Store passkey credential
    await passkeyService.storeCredential({
      credentialId,
      publicKey,
      userId: identity.id,
      authenticatorData,
      clientDataJSON,
    })

    // Generate JWT token
    const token = generateToken(identity.id)

    logger.info(`User registered successfully: ${identity.id}`)

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: identity,
        token,
        stellarAddress: stellarKeypair.publicKey(),
      },
    })
  } catch (error) {
    logger.error('Registration error:', error)
    throw error
  }
}))

// Login with passkey
router.post('/passkey-login', asyncHandler(async (req: Request, res: Response) => {
  const { 
    credentialId, 
    authenticatorData, 
    clientDataJSON, 
    signature 
  } = req.body

  if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
    throw createError('Missing required fields', 400)
  }

  try {
    // Verify passkey authentication
    const authResult = await passkeyService.verifyAuthentication({
      credentialId,
      authenticatorData,
      clientDataJSON,
      signature,
    })

    if (!authResult.isValid) {
      throw createError('Invalid passkey authentication', 401)
    }

    // Get user identity
    const identity = await identityService.getIdentityByPublicKey(authResult.publicKey)
    
    if (!identity) {
      throw createError('Identity not found', 404)
    }

    // Generate JWT token
    const token = generateToken(identity.id)

    logger.info(`User logged in successfully: ${identity.id}`)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: identity,
        token,
      },
    })
  } catch (error) {
    logger.error('Login error:', error)
    throw error
  }
}))

// Generate challenge for passkey authentication
router.get('/challenge', asyncHandler(async (req: Request, res: Response) => {
  const challenge = passkeyService.generateChallenge()
  
  res.json({
    success: true,
    data: {
      challenge: challenge.toString('base64'),
      timeout: 60000, // 60 seconds
    },
  })
}))

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body

  if (!token) {
    throw createError('Token is required', 400)
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const identity = await identityService.getIdentity(decoded.userId)
    
    if (!identity) {
      throw createError('Identity not found', 404)
    }

    const newToken = generateToken(identity.id)

    res.json({
      success: true,
      data: {
        token: newToken,
        user: identity,
      },
    })
  } catch (error) {
    throw createError('Invalid token', 401)
  }
}))

// Logout (client-side token removal)
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // We could implement token blacklisting if needed
  res.json({
    success: true,
    message: 'Logout successful',
  })
}))

// Verify token middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    throw createError('Access token is required', 401)
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      throw createError('Invalid token', 401)
    }

    try {
      const identity = await identityService.getIdentity(decoded.userId)
      if (!identity) {
        throw createError('Identity not found', 404)
      }
      
      req.user = identity
      next()
    } catch (error) {
      next(error)
    }
  })
}

export default router
