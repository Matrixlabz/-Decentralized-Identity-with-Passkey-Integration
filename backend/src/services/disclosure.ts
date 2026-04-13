import { logger } from '@/utils/logger'
import { createError } from '@/middleware/errorHandler'
import { IdentityService } from './identity'
import { StellarService } from './stellar'
import { 
  SelectiveDisclosureRequest, 
  SelectiveDisclosureResponse, 
  ZKProof 
} from '@decentralized-identity/shared'

interface CreateRequestData {
  requesterId: string
  requestedAttributes: string[]
  purpose: string
  expiresAt: Date
}

interface RespondToRequestData {
  requestId: string
  identityId: string
  disclosedAttributes: Record<string, string>
  proofs: Record<string, string>
  signature: string
}

interface PaginationOptions {
  page: number
  limit: number
  status?: string
}

export class DisclosureService {
  private identityService: IdentityService
  private stellarService: StellarService
  private requests: Map<string, SelectiveDisclosureRequest> = new Map()
  private responses: Map<string, SelectiveDisclosureResponse> = new Map()

  constructor() {
    this.identityService = new IdentityService()
    this.stellarService = new StellarService()
  }

  /**
   * Create a selective disclosure request
   */
  async createRequest(data: CreateRequestData): Promise<SelectiveDisclosureRequest> {
    try {
      const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const request: SelectiveDisclosureRequest = {
        id: requestId,
        requester: data.requesterId,
        requestedAttributes: data.requestedAttributes,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      }

      // Store request
      this.requests.set(requestId, request)

      // Optionally store on blockchain for immutability
      if (process.env.STORE_ON_BLOCKCHAIN === 'true') {
        await this.storeRequestOnBlockchain(request)
      }

      logger.info(`Created disclosure request: ${requestId}`)
      return request
    } catch (error) {
      logger.error('Failed to create disclosure request:', error)
      throw createError('Failed to create disclosure request', 500)
    }
  }

  /**
   * Respond to a selective disclosure request
   */
  async respondToRequest(data: RespondToRequestData): Promise<SelectiveDisclosureResponse> {
    try {
      // Get the request
      const request = this.requests.get(data.requestId)
      if (!request) {
        throw createError('Request not found', 404)
      }

      // Check if request has expired
      if (request.expiresAt < new Date()) {
        throw createError('Request has expired', 400)
      }

      // Check if response already exists
      const existingResponse = this.responses.get(data.requestId)
      if (existingResponse) {
        throw createError('Response already exists for this request', 400)
      }

      // Get identity
      const identity = await this.identityService.getIdentity(data.identityId)
      if (!identity) {
        throw createError('Identity not found', 404)
      }

      // Verify signature
      const isValidSignature = this.verifyResponseSignature(
        data.requestId,
        data.disclosedAttributes,
        data.signature,
        identity.publicKey
      )

      if (!isValidSignature) {
        throw createError('Invalid signature', 401)
      }

      // Verify proofs
      await this.verifyProofs(data.disclosedAttributes, data.proofs)

      const response: SelectiveDisclosureResponse = {
        requestId: data.requestId,
        disclosedAttributes: data.disclosedAttributes,
        proofs: data.proofs,
        signature: data.signature,
        timestamp: new Date(),
      }

      // Store response
      this.responses.set(data.requestId, response)

      // Optionally store on blockchain
      if (process.env.STORE_ON_BLOCKCHAIN === 'true') {
        await this.storeResponseOnBlockchain(response)
      }

      logger.info(`Created disclosure response for request: ${data.requestId}`)
      return response
    } catch (error) {
      logger.error('Failed to respond to disclosure request:', error)
      throw error
    }
  }

  /**
   * Get disclosure request
   */
  async getRequest(requestId: string, userId: string): Promise<SelectiveDisclosureRequest> {
    const request = this.requests.get(requestId)
    if (!request) {
      throw createError('Request not found', 404)
    }

    // Check if user has access to this request
    if (request.requester !== userId) {
      throw createError('Access denied', 403)
    }

    return request
  }

  /**
   * Get disclosure response
   */
  async getResponse(requestId: string, userId: string): Promise<SelectiveDisclosureResponse> {
    const response = this.responses.get(requestId)
    if (!response) {
      throw createError('Response not found', 404)
    }

    // Get the request to check permissions
    const request = this.requests.get(requestId)
    if (!request) {
      throw createError('Request not found', 404)
    }

    // Check if user has access to this response
    if (request.requester !== userId) {
      throw createError('Access denied', 403)
    }

    return response
  }

  /**
   * Get requests by requester
   */
  async getRequestsByRequester(
    requesterId: string, 
    options: PaginationOptions
  ): Promise<{ requests: SelectiveDisclosureRequest[], total: number }> {
    const allRequests = Array.from(this.requests.values())
      .filter(request => request.requester === requesterId)
      .filter(request => !options.status || this.getRequestStatus(request) === options.status)

    const total = allRequests.length
    const startIndex = (options.page - 1) * options.limit
    const endIndex = startIndex + options.limit
    const requests = allRequests.slice(startIndex, endIndex)

    return { requests, total }
  }

  /**
   * Get responses by identity
   */
  async getResponsesByIdentity(
    identityId: string,
    options: PaginationOptions
  ): Promise<{ responses: SelectiveDisclosureResponse[], total: number }> {
    const allResponses = Array.from(this.responses.values())
      .filter(response => {
        // Get the request to find the identity
        const request = this.requests.get(response.requestId)
        return request && this.getResponseIdentity(response.requestId) === identityId
      })
      .filter(response => !options.status || this.getResponseStatus(response) === options.status)

    const total = allResponses.length
    const startIndex = (options.page - 1) * options.limit
    const endIndex = startIndex + options.limit
    const responses = allResponses.slice(startIndex, endIndex)

    return { responses, total }
  }

  /**
   * Revoke a disclosure response
   */
  async revokeResponse(requestId: string, identityId: string, reason: string): Promise<void> {
    const response = this.responses.get(requestId)
    if (!response) {
      throw createError('Response not found', 404)
    }

    // Verify ownership
    const responseIdentityId = this.getResponseIdentity(requestId)
    if (responseIdentityId !== identityId) {
      throw createError('Access denied', 403)
    }

    // Mark as revoked (in a real implementation, you might update the response)
    this.responses.delete(requestId)

    logger.info(`Revoked disclosure response: ${requestId}, reason: ${reason}`)
  }

  /**
   * Verify a zero-knowledge proof
   */
  async verifyZKProof(data: ZKProof): Promise<{ isValid: boolean }> {
    try {
      // This is a simplified ZK proof verification
      // In a real implementation, you would use a ZK proof verification library
      
      const isValid = this.verifyZKProofInternal(data.proof, data.publicInputs, data.verificationKey)
      
      logger.info(`ZK proof verification: ${isValid}`)
      return { isValid }
    } catch (error) {
      logger.error('ZK proof verification failed:', error)
      return { isValid: false }
    }
  }

  /**
   * Get disclosure statistics for an identity
   */
  async getDisclosureStats(identityId: string): Promise<{
    totalRequests: number
    totalResponses: number
    revokedResponses: number
    expiredRequests: number
  }> {
    const allRequests = Array.from(this.requests.values())
    const allResponses = Array.from(this.responses.values())

    const totalRequests = allRequests.filter(request => 
      this.getResponseIdentity(request.id) === identityId
    ).length

    const totalResponses = allResponses.filter(response =>
      this.getResponseIdentity(response.requestId) === identityId
    ).length

    const expiredRequests = allRequests.filter(request =>
      request.expiresAt < new Date() &&
      this.getResponseIdentity(request.id) === identityId
    ).length

    return {
      totalRequests,
      totalResponses,
      revokedResponses: 0, // Would need additional tracking
      expiredRequests,
    }
  }

  /**
   * Verify response signature
   */
  private verifyResponseSignature(
    requestId: string,
    disclosedAttributes: Record<string, string>,
    signature: string,
    publicKey: string
  ): boolean {
    try {
      const dataToSign = JSON.stringify({ requestId, disclosedAttributes })
      return this.stellarService.verifySignature(dataToSign, signature, publicKey)
    } catch (error) {
      logger.error('Signature verification failed:', error)
      return false
    }
  }

  /**
   * Verify proofs for disclosed attributes
   */
  private async verifyProofs(
    disclosedAttributes: Record<string, string>,
    proofs: Record<string, string>
  ): Promise<void> {
    for (const [attribute, proof] of Object.entries(proofs)) {
      if (!disclosedAttributes[attribute]) {
        throw createError(`Proof provided for non-disclosed attribute: ${attribute}`, 400)
      }

      // Verify the proof (simplified - would use actual verification logic)
      const isValidProof = this.verifyAttributeProof(disclosedAttributes[attribute], proof)
      if (!isValidProof) {
        throw createError(`Invalid proof for attribute: ${attribute}`, 400)
      }
    }
  }

  /**
   * Verify individual attribute proof
   */
  private verifyAttributeProof(value: string, proof: string): boolean {
    // Simplified proof verification
    // In reality, this would involve cryptographic verification
    return proof.length > 0 // Placeholder
  }

  /**
   * Verify ZK proof (internal implementation)
   */
  private verifyZKProofInternal(proof: string, publicInputs: string[], verificationKey: string): boolean {
    // Simplified ZK proof verification
    // In reality, this would use a ZK proof verification library
    return proof.length > 0 && verificationKey.length > 0 // Placeholder
  }

  /**
   * Get request status
   */
  private getRequestStatus(request: SelectiveDisclosureRequest): string {
    if (request.expiresAt < new Date()) {
      return 'expired'
    }
    
    const hasResponse = this.responses.has(request.id)
    return hasResponse ? 'responded' : 'pending'
  }

  /**
   * Get response status
   */
  private getResponseStatus(response: SelectiveDisclosureResponse): string {
    // Simplified - in reality would track revocation status
    return 'active'
  }

  /**
   * Get identity for a response (simplified)
   */
  private getResponseIdentity(requestId: string): string {
    // In a real implementation, this would track which identity responded
    return 'identity_placeholder'
  }

  /**
   * Store request on blockchain
   */
  private async storeRequestOnBlockchain(request: SelectiveDisclosureRequest): Promise<void> {
    try {
      // Store request hash on blockchain for immutability
      const requestHash = this.hashRequest(request)
      await this.stellarService.storeData(requestHash)
    } catch (error) {
      logger.error('Failed to store request on blockchain:', error)
      // Don't throw - blockchain storage should be optional
    }
  }

  /**
   * Store response on blockchain
   */
  private async storeResponseOnBlockchain(response: SelectiveDisclosureResponse): Promise<void> {
    try {
      const responseHash = this.hashResponse(response)
      await this.stellarService.storeData(responseHash)
    } catch (error) {
      logger.error('Failed to store response on blockchain:', error)
      // Don't throw - blockchain storage should be optional
    }
  }

  /**
   * Hash request for blockchain storage
   */
  private hashRequest(request: SelectiveDisclosureRequest): string {
    const data = JSON.stringify(request)
    return this.stellarService.hashData(data)
  }

  /**
   * Hash response for blockchain storage
   */
  private hashResponse(response: SelectiveDisclosureResponse): string {
    const data = JSON.stringify(response)
    return this.stellarService.hashData(data)
  }
}
