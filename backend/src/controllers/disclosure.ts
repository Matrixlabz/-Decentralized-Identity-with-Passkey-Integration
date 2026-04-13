import { Router, Request, Response } from 'express'
import { asyncHandler } from '@/middleware/errorHandler'
import { DisclosureService } from '@/services/disclosure'
import { IdentityService } from '@/services/identity'
import { authenticateToken } from './auth'
import { createError } from '@/middleware/errorHandler'
import { logger } from '@/utils/logger'

const router = Router()
const disclosureService = new DisclosureService()
const identityService = new IdentityService()

interface AuthRequest extends Request {
  user?: any
}

// Create a selective disclosure request
router.post('/request', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestedAttributes, purpose, expiresAt } = req.body
  const requesterId = req.user.id

  if (!requestedAttributes || !Array.isArray(requestedAttributes) || requestedAttributes.length === 0) {
    throw createError('requestedAttributes is required and must be a non-empty array', 400)
  }

  if (!purpose || typeof purpose !== 'string') {
    throw createError('purpose is required and must be a string', 400)
  }

  if (!expiresAt || new Date(expiresAt) <= new Date()) {
    throw createError('expiresAt is required and must be in the future', 400)
  }

  try {
    const request = await disclosureService.createRequest({
      requesterId,
      requestedAttributes,
      purpose,
      expiresAt: new Date(expiresAt),
    })

    logger.info(`Disclosure request created: ${request.id} by ${requesterId}`)

    res.status(201).json({
      success: true,
      message: 'Disclosure request created successfully',
      data: request,
    })
  } catch (error) {
    logger.error('Failed to create disclosure request:', error)
    throw error
  }
}))

// Respond to a selective disclosure request
router.post('/respond', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId, disclosedAttributes, proofs, signature } = req.body
  const identityId = req.user.id

  if (!requestId) {
    throw createError('requestId is required', 400)
  }

  if (!disclosedAttributes || typeof disclosedAttributes !== 'object') {
    throw createError('disclosedAttributes is required and must be an object', 400)
  }

  if (!proofs || typeof proofs !== 'object') {
    throw createError('proofs is required and must be an object', 400)
  }

  if (!signature || typeof signature !== 'string') {
    throw createError('signature is required and must be a string', 400)
  }

  try {
    const response = await disclosureService.respondToRequest({
      requestId,
      identityId,
      disclosedAttributes,
      proofs,
      signature,
    })

    logger.info(`Disclosure response created for request: ${requestId}`)

    res.status(201).json({
      success: true,
      message: 'Disclosure response created successfully',
      data: response,
    })
  } catch (error) {
    logger.error('Failed to respond to disclosure request:', error)
    throw error
  }
}))

// Get disclosure request details
router.get('/request/:requestId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params
  const userId = req.user.id

  try {
    const request = await disclosureService.getRequest(requestId, userId)

    res.json({
      success: true,
      data: request,
    })
  } catch (error) {
    logger.error('Failed to get disclosure request:', error)
    throw error
  }
}))

// Get disclosure response details
router.get('/response/:requestId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params
  const userId = req.user.id

  try {
    const response = await disclosureService.getResponse(requestId, userId)

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    logger.error('Failed to get disclosure response:', error)
    throw error
  }
}))

// Get user's disclosure requests
router.get('/requests', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id
  const { status, page = 1, limit = 10 } = req.query

  try {
    const requests = await disclosureService.getRequestsByRequester(userId, {
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    })

    res.json({
      success: true,
      data: requests,
    })
  } catch (error) {
    logger.error('Failed to get disclosure requests:', error)
    throw error
  }
}))

// Get user's disclosure responses
router.get('/responses', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const identityId = req.user.id
  const { status, page = 1, limit = 10 } = req.query

  try {
    const responses = await disclosureService.getResponsesByIdentity(identityId, {
      status: status as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    })

    res.json({
      success: true,
      data: responses,
    })
  } catch (error) {
    logger.error('Failed to get disclosure responses:', error)
    throw error
  }
}))

// Revoke a disclosure response
router.post('/revoke/:requestId', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params
  const { reason } = req.body
  const identityId = req.user.id

  if (!reason || typeof reason !== 'string') {
    throw createError('reason is required and must be a string', 400)
  }

  try {
    await disclosureService.revokeResponse(requestId, identityId, reason)

    logger.info(`Disclosure response revoked: ${requestId}`)

    res.json({
      success: true,
      message: 'Disclosure response revoked successfully',
    })
  } catch (error) {
    logger.error('Failed to revoke disclosure response:', error)
    throw error
  }
}))

// Verify a zero-knowledge proof
router.post('/verify-zk-proof', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { proof, publicInputs, verificationKey } = req.body

  if (!proof || typeof proof !== 'string') {
    throw createError('proof is required and must be a string', 400)
  }

  if (!publicInputs || !Array.isArray(publicInputs)) {
    throw createError('publicInputs is required and must be an array', 400)
  }

  if (!verificationKey || typeof verificationKey !== 'string') {
    throw createError('verificationKey is required and must be a string', 400)
  }

  try {
    const isValid = await disclosureService.verifyZKProof({
      proof,
      publicInputs,
      verificationKey,
    })

    res.json({
      success: true,
      data: {
        isValid,
      },
    })
  } catch (error) {
    logger.error('Failed to verify ZK proof:', error)
    throw error
  }
}))

// Get disclosure statistics
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const identityId = req.user.id

  try {
    const stats = await disclosureService.getDisclosureStats(identityId)

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Failed to get disclosure stats:', error)
    throw error
  }
}))

export default router
