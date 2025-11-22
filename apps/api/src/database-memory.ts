/**
 * In-memory database for demo purposes
 * Uses Map instead of SQLite to avoid native module compilation
 */

// PaymentRecord type definition
export interface PaymentRecord {
  txid: string;
  amount: number;
  proofHash: string;
  timestamp: number;
  confirmed: boolean;
}

// CredentialRecord type definition
export interface CredentialRecord {
  unique_key_hash: string;
  issuedAt: string;
  id: string;
}

export class Database {
  private payments: Map<string, PaymentRecord> = new Map();
  private credentials: Map<string, CredentialRecord> = new Map();

  constructor() {
    // No initialization needed for in-memory
  }

  init() {
    // Already initialized
    console.log('Using in-memory database for demo');
  }

  /**
   * Store a payment record
   */
  storePayment(payment: PaymentRecord) {
    this.payments.set(payment.txid, payment);
  }

  /**
   * Get payment by transaction ID
   */
  getPaymentByTxId(txid: string): PaymentRecord | null {
    return this.payments.get(txid) || null;
  }

  /**
   * Get payment by proof hash
   */
  getPaymentByProofHash(proofHash: string): PaymentRecord | null {
    for (const payment of this.payments.values()) {
      if (payment.proofHash === proofHash) {
        return payment;
      }
    }
    return null;
  }

  /**
   * Update payment confirmation status
   */
  updateConfirmation(txid: string, confirmed: boolean) {
    const payment = this.payments.get(txid);
    if (payment) {
      payment.confirmed = confirmed;
      this.payments.set(txid, payment);
    }
  }

  /**
   * Store a credential record (only unique_key_hash + timestamp)
   */
  storeCredential(credential: CredentialRecord) {
    this.credentials.set(credential.unique_key_hash, credential);
  }

  /**
   * Get credential by unique_key_hash
   */
  getCredentialByHash(unique_key_hash: string): CredentialRecord | null {
    return this.credentials.get(unique_key_hash) || null;
  }

  /**
   * Get all credentials (for admin/debugging only)
   */
  getAllCredentials(): CredentialRecord[] {
    return Array.from(this.credentials.values());
  }

  close() {
    this.payments.clear();
    this.credentials.clear();
  }
}

