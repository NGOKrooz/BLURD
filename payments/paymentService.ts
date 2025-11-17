/**
 * Payment Service
 * Orchestrates payment operations with ZK proof binding
 */

import { ZcashClient, PaymentResult, TransactionStatus } from './zcashClient';
import { hashProof } from '../shared/utils';

export interface PaymentWithProof {
  amount: number;
  toAddress: string;
  proof: any;
  proofHash: string;
}

export interface PaymentRecord {
  txid: string;
  amount: number;
  proofHash: string;
  timestamp: number;
  confirmed: boolean;
}

/**
 * Payment Service
 * Handles payment creation with ZK proof binding
 */
export class PaymentService {
  private zcashClient: ZcashClient;

  constructor(zcashClient: ZcashClient) {
    this.zcashClient = zcashClient;
  }

  /**
   * Send a payment with bound ZK proof
   */
  async sendPaymentWithProof(
    payment: PaymentWithProof
  ): Promise<PaymentResult> {
    // Include proof hash in memo
    const memo = payment.proofHash;

    // Send shielded transaction
    const result = await this.zcashClient.sendShieldedPayment(
      payment.toAddress,
      payment.amount,
      memo
    );

    return result;
  }

  /**
   * Verify payment and proof binding
   */
  async verifyPaymentAndProof(
    txid: string,
    proofHash: string
  ): Promise<{
    paymentExists: boolean;
    proofHashMatches: boolean;
    confirmed: boolean;
  }> {
    const tx = await this.zcashClient.getTransactionStatus(txid);
    const extractedHash = await this.zcashClient.extractProofHash(txid);

    return {
      paymentExists: !!tx,
      proofHashMatches: extractedHash === proofHash,
      confirmed: tx.confirmed,
    };
  }

  /**
   * Create payment record for merchant lookup
   */
  createPaymentRecord(
    txid: string,
    amount: number,
    proofHash: string
  ): PaymentRecord {
    return {
      txid,
      amount,
      proofHash,
      timestamp: Date.now(),
      confirmed: false,
    };
  }
}

