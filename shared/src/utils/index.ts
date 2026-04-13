import { StellarKeypair } from 'stellar-sdk';

export class StellarUtils {
  static generateKeypair(): StellarKeypair {
    return StellarKeypair.random();
  }

  static validateAddress(address: string): boolean {
    try {
      StellarKeypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  static hashData(data: string): string {
    // Implement proper hashing using Stellar's crypto utilities
    return Buffer.from(data).toString('hex');
  }

  static signMessage(message: string, keypair: StellarKeypair): string {
    const signature = keypair.sign(Buffer.from(message));
    return signature.toString('base64');
  }

  static verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      const kp = StellarKeypair.fromPublicKey(publicKey);
      const sig = Buffer.from(signature, 'base64');
      return kp.verify(Buffer.from(message), sig);
    } catch {
      return false;
    }
  }
}

export class PasskeyUtils {
  static async createPasskey(userId: string, displayName: string): Promise<PublicKeyCredential> {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Decentralized Identity',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: displayName,
          displayName,
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256 (secp256r1)
            type: 'public-key',
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: true,
        },
        attestation: 'direct',
      },
    });

    if (!credential) {
      throw new Error('Failed to create passkey');
    }

    return credential;
  }

  static async authenticateWithPasskey(challenge: Uint8Array): Promise<PublicKeyCredential> {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [], // Allow any passkey for resident key
        userVerification: 'required',
      },
    });

    if (!assertion) {
      throw new Error('Authentication failed');
    }

    return assertion;
  }

  static extractPublicKey(credential: PublicKeyCredential): string {
    const response = credential.response as AuthenticatorAttestationResponse;
    const publicKey = response.getPublicKey();
    if (!publicKey) {
      throw new Error('Public key not found in credential');
    }
    return Buffer.from(publicKey).toString('base64');
  }
}

export class EncryptionUtils {
  static async encryptData(data: string, publicKey: string): Promise<string> {
    // Implement proper encryption using Web Crypto API
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = Buffer.from(publicKey, 'base64');
    
    // This is a simplified implementation
    // In production, use proper encryption libraries
    return Buffer.from(dataBuffer).toString('hex');
  }

  static async decryptData(encryptedData: string, privateKey: string): Promise<string> {
    // Implement proper decryption using Web Crypto API
    const encryptedBuffer = Buffer.from(encryptedData, 'hex');
    
    // This is a simplified implementation
    // In production, use proper encryption libraries
    return encryptedBuffer.toString();
  }

  static generateSalt(): string {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return Buffer.from(salt).toString('hex');
  }
}

export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}
