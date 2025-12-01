/**
 * In-memory database implementation that matches the Database interface.
 * Useful for local development or environments where file writes are not possible.
 */

import type {
  Database,
  CredentialRecord,
  PaymentRecord,
  ProofRecord,
} from './database';

export class MemoryDatabase implements Database {
  private payments: Map<string, PaymentRecord> = new Map();
  private credentials: Map<string, CredentialRecord> = new Map();
  private proofs: Map<string, ProofRecord> = new Map();

  async init(): Promise<void> {
    console.log('Using in-memory database implementation');
  }

  // ---- Credentials ----

  async saveCredential(data: any): Promise<void> {
    const record: CredentialRecord = {
      id: data.id,
      unique_key_hash: data.unique_key_hash,
      issuedAt: data.issuedAt,
    };

    this.credentials.set(record.unique_key_hash, record);
  }

  async getCredential(id: string): Promise<any> {
    // Treat `id` as unique_key_hash for compatibility with routes.
    return this.credentials.get(id) ?? null;
  }

  async listCredentials(): Promise<any[]> {
    return Array.from(this.credentials.values());
  }

  // ---- Proofs ----

  async saveProof(data: any): Promise<void> {
    const record: ProofRecord = {
      proofHash: data.proofHash,
      proof: data.proof,
      publicSignals: data.publicSignals,
      timestamp: data.timestamp ?? Date.now(),
    };

    this.proofs.set(record.proofHash, record);
  }

  async listProofs(): Promise<any[]> {
    return Array.from(this.proofs.values());
  }

  // ---- Payments ----

  async savePayment(data: any): Promise<void> {
    const record: PaymentRecord = {
      txid: data.txid,
      amount: data.amount,
      proofHash: data.proofHash,
      timestamp: data.timestamp ?? Date.now(),
      confirmed: Boolean(data.confirmed),
    };

    this.payments.set(record.txid, record);
  }

  async listPayments(): Promise<any[]> {
    return Array.from(this.payments.values());
  }
}


