import {
  Keypair,
  Networks,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import axios from 'axios';
import { logger } from '@/utils/logger';

export class StellarService {
  private rpcServer: rpc.Server;
  private networkPassphrase: string;
  private friendbotUrl: string;

  constructor() {
    const rpcUrl = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    this.networkPassphrase =
      process.env.STELLAR_NETWORK === 'MAINNET'
        ? Networks.PUBLIC
        : Networks.TESTNET;
    this.friendbotUrl =
      process.env.FRIENDBOT_URL || 'https://friendbot.stellar.org';
    this.rpcServer = new rpc.Server(rpcUrl);
  }

  /**
   * Generate an authentic Stellar Ed25519 Keypair.
   */
  generateKeypair(): Keypair {
    return Keypair.random();
  }

  /**
   * Validate Stellar G-address format.
   */
  isValidAddress(address: string): boolean {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Request Testnet Lumens from Friendbot for a new public key.
   */
  async fundTestnetAccount(publicKey: string): Promise<boolean> {
    try {
      logger.info(`Funding Testnet account via Friendbot: ${publicKey}`);
      const res = await axios.get(`${this.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
      return res.status === 200;
    } catch (err: any) {
      // Account may already exist and be funded
      if (err.response?.status === 400) {
        logger.warn(`Account already funded or Friendbot 400: ${err.message}`);
        return true;
      }
      logger.error('Friendbot funding failed:', err.message);
      return false;
    }
  }

  /**
   * Fetch on-chain account details via Soroban RPC.
   */
  async getAccount(publicKey: string): Promise<rpc.Api.GetAccountResponse | null> {
    try {
      return await this.rpcServer.getAccount(publicKey);
    } catch (err) {
      logger.warn(`Account not found on-chain yet: ${publicKey}`);
      return null;
    }
  }

  /**
   * Verify an Ed25519 signature over a message string.
   */
  verifySignature(message: string, signatureBase64: string, publicKey: string): boolean {
    try {
      const kp = Keypair.fromPublicKey(publicKey);
      return kp.verify(Buffer.from(message, 'utf8'), Buffer.from(signatureBase64, 'base64'));
    } catch {
      return false;
    }
  }

  /**
   * Sign message with secret key.
   */
  signMessage(message: string, secretKey: string): string {
    const kp = Keypair.fromSecret(secretKey);
    return kp.sign(Buffer.from(message, 'utf8')).toString('base64');
  }

  /**
   * Read-only simulation of a Soroban contract call.
   */
  async simulateContractCall(
    contractAddress: string,
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    try {
      // Placeholder simulating Soroban RPC read
      logger.info(`Simulating contract call: ${contractAddress} -> ${functionName}`);
      return { success: true, simulatedResult: null };
    } catch (error) {
      logger.error('Contract simulation error:', error);
      throw error;
    }
  }
}
