import { Keypair } from '@stellar/stellar-sdk';

/**
 * Isomorphic cryptographic helper functions for Node and Browser environments.
 */
function getCryptoSubtle(): SubtleCrypto | null {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  return null;
}

export class StellarUtils {
  /**
   * Generate a random Stellar Ed25519 Keypair.
   */
  static generateKeypair(): Keypair {
    return Keypair.random();
  }

  /**
   * Validate a Stellar public G-address.
   */
  static validateAddress(address: string): boolean {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cryptographically secure SHA-256 hash of a UTF-8 string or buffer.
   * Returns a 64-character lowercase hex string.
   */
  static async hashData(data: string | Uint8Array): Promise<string> {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const subtle = getCryptoSubtle();
    if (subtle) {
      const hashBuffer = await subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Node.js fallback
    try {
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(bytes).digest('hex');
    } catch {
      throw new Error('No cryptographic environment available for SHA-256 hashing');
    }
  }

  /**
   * Synchronous SHA-256 hash for Node.js environments.
   */
  static hashDataSync(data: string | Uint8Array): string {
    const bytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(bytes).digest('hex');
    } catch {
      throw new Error('hashDataSync is only supported in Node.js environments');
    }
  }

  /**
   * Sign an arbitrary UTF-8 message string using a Stellar Keypair.
   */
  static signMessage(message: string, keypair: Keypair): string {
    const messageBytes = Buffer.from(message, 'utf8');
    const signature = keypair.sign(messageBytes);
    return signature.toString('base64');
  }

  /**
   * Verify an Ed25519 signature over an arbitrary UTF-8 message string.
   */
  static verifySignature(message: string, signatureBase64: string, publicKey: string): boolean {
    try {
      const kp = Keypair.fromPublicKey(publicKey);
      const messageBytes = Buffer.from(message, 'utf8');
      const sigBytes = Buffer.from(signatureBase64, 'base64');
      return kp.verify(messageBytes, sigBytes);
    } catch {
      return false;
    }
  }
}

export class PasskeyUtils {
  /**
   * Encode Uint8Array or Buffer to standard WebAuthn Base64URL string (RFC 4648 §5).
   */
  static base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Decode a WebAuthn Base64URL string into Uint8Array.
   */
  static base64UrlDecode(str: string): Uint8Array {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    if (typeof atob !== 'undefined') {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  /**
   * Register a new Passkey credential using client-side WebAuthn API.
   * Expects a server-generated random challenge buffer to prevent replay attacks.
   */
  static async createPasskey(
    userId: string,
    displayName: string,
    serverChallenge: Uint8Array
  ): Promise<PublicKeyCredential> {
    if (typeof navigator === 'undefined' || !navigator.credentials) {
      throw new Error('WebAuthn is not supported in this environment');
    }

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: serverChallenge,
        rp: {
          name: 'Equinox Prime DID',
          id: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: displayName,
          displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256 (Secp256r1)
          { alg: -257, type: 'public-key' }, // RS256
          { alg: -8, type: 'public-key' },  // EdDSA
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: true,
        },
        attestation: 'none',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Passkey creation returned null or was cancelled');
    }

    return credential;
  }

  /**
   * Authenticate using an existing Passkey credential with server challenge.
   */
  static async authenticateWithPasskey(serverChallenge: Uint8Array): Promise<PublicKeyCredential> {
    if (typeof navigator === 'undefined' || !navigator.credentials) {
      throw new Error('WebAuthn is not supported in this environment');
    }

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: serverChallenge,
        allowCredentials: [],
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Passkey authentication failed or was cancelled');
    }

    return assertion;
  }

  /**
   * Parse WebAuthn AuthenticatorData flags.
   */
  static parseAuthenticatorFlags(authenticatorData: Uint8Array): {
    userPresent: boolean;
    userVerified: boolean;
    backupEligibility: boolean;
    backupState: boolean;
  } {
    if (authenticatorData.length < 33) {
      throw new Error('Authenticator data is too short');
    }
    const flags = authenticatorData[32];
    return {
      userPresent: (flags & 0x01) !== 0,
      userVerified: (flags & 0x04) !== 0,
      backupEligibility: (flags & 0x08) !== 0,
      backupState: (flags & 0x10) !== 0,
    };
  }
}

export class EncryptionUtils {
  /**
   * Derive a 256-bit AES-GCM CryptoKey using PBKDF2 from a secret key/passphrase.
   */
  private static async deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const subtle = getCryptoSubtle();
    if (!subtle) {
      throw new Error('Web Crypto API required for key derivation');
    }

    const keyMaterial = await subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt plaintext string using AES-256-GCM.
   * Format: base64(salt[16] || iv[12] || ciphertext+tag)
   */
  static async encryptData(plaintext: string, secretKey: string): Promise<string> {
    const subtle = getCryptoSubtle();
    if (subtle) {
      const salt = new Uint8Array(16);
      globalThis.crypto.getRandomValues(salt);

      const iv = new Uint8Array(12);
      globalThis.crypto.getRandomValues(iv);

      const key = await this.deriveKey(secretKey, salt);
      const encodedPlaintext = new TextEncoder().encode(plaintext);

      const encryptedBuffer = await subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedPlaintext
      );

      const cipherBytes = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(salt.length + iv.length + cipherBytes.length);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(cipherBytes, salt.length + iv.length);

      return PasskeyUtils.base64UrlEncode(combined);
    }

    // Node.js fallback
    try {
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);
      const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha256');

      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();

      const combined = Buffer.concat([salt, iv, encrypted, tag]);
      return PasskeyUtils.base64UrlEncode(combined);
    } catch {
      throw new Error('Encryption environment unavailable');
    }
  }

  /**
   * Decrypt AES-256-GCM encrypted payload with secret key.
   */
  static async decryptData(payloadBase64Url: string, secretKey: string): Promise<string> {
    const rawBytes = PasskeyUtils.base64UrlDecode(payloadBase64Url);
    if (rawBytes.length < 16 + 12 + 16) {
      throw new Error('Invalid encrypted payload length');
    }

    const salt = rawBytes.slice(0, 16);
    const iv = rawBytes.slice(16, 28);
    const cipherData = rawBytes.slice(28);

    const subtle = getCryptoSubtle();
    if (subtle) {
      const key = await this.deriveKey(secretKey, salt);
      const decryptedBuffer = await subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherData
      );
      return new TextDecoder().decode(decryptedBuffer);
    }

    // Node.js fallback
    try {
      const crypto = await import('crypto');
      const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha256');

      // Tag is last 16 bytes
      const tag = cipherData.slice(cipherData.length - 16);
      const ciphertext = cipherData.slice(0, cipherData.length - 16);

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString('utf8');
    } catch (err) {
      throw new Error(`Decryption failed: ${(err as Error).message}`);
    }
  }
}

export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{8,20}$/;
    return phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 8;
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}
