/**
 * JSON-file backed database implementation (Vercel friendly, no native modules).
 * Persists data to ./data/blurd-db.json when possible, with in-memory fallback.
 */

import * as path from 'path';
import * as fs from 'fs';

// Generic record shapes used by the Database interface
export interface CredentialRecord {
  id: string;
  unique_key_hash: string;
  issuedAt: string;
}

export interface ProofRecord {
  proofHash: string;
  proof: any;
  publicSignals: any[];
  timestamp: number;
}

export interface PaymentRecord {
  txid: string;
  amount: number;
  proofHash: string;
  timestamp: number;
  confirmed: boolean;
}

export interface Database {
  init(): Promise<void>;

  // Credentials
  saveCredential(data: any): Promise<void>;
  getCredential(id: string): Promise<any>;
  listCredentials(): Promise<any[]>;

  // Proofs
  saveProof(data: any): Promise<void>;
  listProofs(): Promise<any[]>;

  // Payments
  savePayment(data: any): Promise<void>;
  listPayments(): Promise<any[]>;
}

interface InternalStoreShape {
  credentials: CredentialRecord[];
  proofs: ProofRecord[];
  payments: PaymentRecord[];
}

const DEFAULT_STORE: InternalStoreShape = {
  credentials: [],
  proofs: [],
  payments: [],
};

/**
 * JSON file backed implementation of the Database interface.
 * Uses ./data/blurd-db.json relative to the process working directory.
 */
export class JSONDatabase implements Database {
  private readonly dataDir: string;
  private readonly filePath: string;
  private store: InternalStoreShape = { ...DEFAULT_STORE };
  private filePersistenceAvailable = true;

  constructor() {
    // Use a stable relative path: ./data/blurd-db.json from project root
    this.dataDir = path.join(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, 'blurd-db.json');
  }

  async init(): Promise<void> {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (!fs.existsSync(this.filePath)) {
        await fs.promises.writeFile(
          this.filePath,
          JSON.stringify(DEFAULT_STORE, null, 2),
          'utf-8'
        );
        this.store = { ...DEFAULT_STORE };
        return;
      }

      const raw = await fs.promises.readFile(this.filePath, 'utf-8');
      if (!raw) {
        this.store = { ...DEFAULT_STORE };
        return;
      }

      const parsed = JSON.parse(raw);
      this.store = {
        credentials: Array.isArray(parsed.credentials) ? parsed.credentials : [],
        proofs: Array.isArray(parsed.proofs) ? parsed.proofs : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      };
    } catch (err) {
      // If anything goes wrong, fall back to in-memory only
      console.error('Failed to initialize JSONDatabase, using in-memory only:', err);
      this.store = { ...DEFAULT_STORE };
      this.filePersistenceAvailable = false;
    }
  }

  private async persist(): Promise<void> {
    if (!this.filePersistenceAvailable) return;

    try {
      await fs.promises.writeFile(
        this.filePath,
        JSON.stringify(this.store, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to persist JSONDatabase, switching to in-memory only:', err);
      this.filePersistenceAvailable = false;
    }
  }

  // ---- Credentials ----

  async saveCredential(data: any): Promise<void> {
    const record: CredentialRecord = {
      id: data.id,
      unique_key_hash: data.unique_key_hash,
      issuedAt: data.issuedAt,
    };

    const existingIndex = this.store.credentials.findIndex(
      (c) => c.unique_key_hash === record.unique_key_hash
    );

    if (existingIndex >= 0) {
      this.store.credentials[existingIndex] = record;
    } else {
      this.store.credentials.push(record);
    }

    await this.persist();
  }

  async getCredential(id: string): Promise<any> {
    // Here `id` is treated as unique_key_hash for compatibility with existing routes.
    return this.store.credentials.find((c) => c.unique_key_hash === id) ?? null;
  }

  async listCredentials(): Promise<any[]> {
    return [...this.store.credentials];
  }

  // ---- Proofs ----

  async saveProof(data: any): Promise<void> {
    const record: ProofRecord = {
      proofHash: data.proofHash,
      proof: data.proof,
      publicSignals: data.publicSignals,
      timestamp: data.timestamp ?? Date.now(),
    };

    const existingIndex = this.store.proofs.findIndex(
      (p) => p.proofHash === record.proofHash
    );

    if (existingIndex >= 0) {
      this.store.proofs[existingIndex] = record;
    } else {
      this.store.proofs.push(record);
    }

    await this.persist();
  }

  async listProofs(): Promise<any[]> {
    return [...this.store.proofs];
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

    const existingIndex = this.store.payments.findIndex(
      (p) => p.txid === record.txid
    );

    if (existingIndex >= 0) {
      this.store.payments[existingIndex] = record;
    } else {
      this.store.payments.push(record);
    }

    await this.persist();
  }

  async listPayments(): Promise<any[]> {
    return [...this.store.payments];
  }
}


