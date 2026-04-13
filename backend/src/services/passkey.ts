import { logger } from '@/utils/logger'
import { createError } from '@/middleware/errorHandler'
import crypto from 'crypto'

interface PasskeyRegistrationData {
  credentialId: string
  publicKey: string
  authenticatorData: string
  clientDataJSON: string
  signature: string
}

interface PasskeyAuthenticationData {
  credentialId: string
  authenticatorData: string
  clientDataJSON: string
  signature: string
}

interface StoredCredential {
  credentialId: string
  publicKey: string
  userId: string
  authenticatorData: string
  clientDataJSON: string
  createdAt: Date
}

export class PasskeyService {
  private credentials: Map<string, StoredCredential> = new Map()

  /**
   * Generate a random challenge for passkey authentication
   */
  generateChallenge(): Buffer {
    return crypto.randomBytes(32)
  }

  /**
   * Verify passkey registration
   */
  async verifyRegistration(data: PasskeyRegistrationData): Promise<boolean> {
    try {
      // Parse client data JSON
      const clientData = JSON.parse(atob(data.clientDataJSON))
      
      // Verify the challenge (in a real implementation, this would be checked against stored challenge)
      if (!clientData.challenge) {
        throw new Error('Missing challenge in client data')
      }

      // Verify the origin
      const expectedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'
      if (clientData.origin !== expectedOrigin) {
        throw new Error(`Invalid origin: ${clientData.origin}`)
      }

      // Verify the type
      if (clientData.type !== 'webauthn.create') {
        throw new Error(`Invalid type: ${clientData.type}`)
      }

      // Parse authenticator data
      const authenticatorData = Buffer.from(data.authenticatorData, 'base64')
      
      // Verify user present flag (bit 0)
      const flags = authenticatorData[32]
      if (!(flags & 0x01)) {
        throw new Error('User not present')
      }

      // Verify user verified flag (bit 2)
      if (!(flags & 0x04)) {
        throw new Error('User not verified')
      }

      // Verify the signature (simplified - in reality, this would involve COSE key parsing)
      const isValidSignature = this.verifySignature(
        data.clientDataJSON,
        data.signature,
        data.publicKey
      )

      if (!isValidSignature) {
        throw new Error('Invalid signature')
      }

      logger.info(`Passkey registration verified for credential: ${data.credentialId}`)
      return true
    } catch (error) {
      logger.error('Passkey registration verification failed:', error)
      return false
    }
  }

  /**
   * Verify passkey authentication
   */
  async verifyAuthentication(data: PasskeyAuthenticationData): Promise<{ isValid: boolean; publicKey?: string }> {
    try {
      // Get stored credential
      const storedCredential = this.credentials.get(data.credentialId)
      if (!storedCredential) {
        throw new Error('Credential not found')
      }

      // Parse client data JSON
      const clientData = JSON.parse(atob(data.clientDataJSON))
      
      // Verify the challenge
      if (!clientData.challenge) {
        throw new Error('Missing challenge in client data')
      }

      // Verify the origin
      const expectedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000'
      if (clientData.origin !== expectedOrigin) {
        throw new Error(`Invalid origin: ${clientData.origin}`)
      }

      // Verify the type
      if (clientData.type !== 'webauthn.get') {
        throw new Error(`Invalid type: ${clientData.type}`)
      }

      // Parse authenticator data
      const authenticatorData = Buffer.from(data.authenticatorData, 'base64')
      
      // Verify user present flag (bit 0)
      const flags = authenticatorData[32]
      if (!(flags & 0x01)) {
        throw new Error('User not present')
      }

      // Verify user verified flag (bit 2)
      if (!(flags & 0x04)) {
        throw new Error('User not verified')
      }

      // Verify the signature
      const isValidSignature = this.verifySignature(
        data.clientDataJSON,
        data.signature,
        storedCredential.publicKey
      )

      if (!isValidSignature) {
        throw new Error('Invalid signature')
      }

      logger.info(`Passkey authentication verified for credential: ${data.credentialId}`)
      return { isValid: true, publicKey: storedCredential.publicKey }
    } catch (error) {
      logger.error('Passkey authentication verification failed:', error)
      return { isValid: false }
    }
  }

  /**
   * Store passkey credential
   */
  async storeCredential(data: PasskeyRegistrationData & { userId: string }): Promise<void> {
    const storedCredential: StoredCredential = {
      credentialId: data.credentialId,
      publicKey: data.publicKey,
      userId: data.userId,
      authenticatorData: data.authenticatorData,
      clientDataJSON: data.clientDataJSON,
      createdAt: new Date(),
    }

    this.credentials.set(data.credentialId, storedCredential)
    logger.info(`Stored passkey credential: ${data.credentialId}`)
  }

  /**
   * Get credential by ID
   */
  getCredential(credentialId: string): StoredCredential | undefined {
    return this.credentials.get(credentialId)
  }

  /**
   * Get credentials by user ID
   */
  getCredentialsByUserId(userId: string): StoredCredential[] {
    return Array.from(this.credentials.values()).filter(
      credential => credential.userId === userId
    )
  }

  /**
   * Delete credential
   */
  deleteCredential(credentialId: string): boolean {
    const deleted = this.credentials.delete(credentialId)
    if (deleted) {
      logger.info(`Deleted passkey credential: ${credentialId}`)
    }
    return deleted
  }

  /**
   * Verify signature (simplified implementation)
   */
  private verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      // This is a simplified signature verification
      // In a real implementation, you would:
      // 1. Parse the COSE key to extract the actual public key
      // 2. Parse the signature format
      // 3. Verify using the appropriate crypto algorithm (ES256 for Secp256r1)
      
      const dataBuffer = Buffer.from(data, 'utf8')
      const signatureBuffer = Buffer.from(signature, 'base64')
      const publicKeyBuffer = Buffer.from(publicKey, 'base64')

      // Simplified verification - in reality, use Web Crypto API or appropriate crypto library
      return crypto.verify(
        'sha256',
        dataBuffer,
        {
          key: publicKeyBuffer,
          format: 'der',
          type: 'spki',
        },
        signatureBuffer
      )
    } catch (error) {
      logger.error('Signature verification failed:', error)
      return false
    }
  }

  /**
   * Extract public key from credential response
   */
  extractPublicKey(authenticatorResponse: any): string {
    try {
      const publicKeyBuffer = authenticatorResponse.getPublicKey()
      if (!publicKeyBuffer) {
        throw new Error('Public key not found in credential response')
      }
      return publicKeyBuffer.toString('base64')
    } catch (error) {
      logger.error('Failed to extract public key:', error)
      throw createError('Failed to extract public key', 400)
    }
  }

  /**
   * Check if passkey is supported by the browser
   */
  static isPasskeySupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      navigator.credentials &&
      navigator.credentials.create &&
      navigator.credentials.get
    )
  }

  /**
   * Get supported algorithms for passkey
   */
  static getSupportedAlgorithms(): Array<{ alg: number; type: string }> {
    return [
      { alg: -7, type: 'public-key' }, // ES256 (Secp256r1)
      { alg: -35, type: 'public-key' }, // Ed25519
    ]
  }
}
