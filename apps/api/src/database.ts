/**
 * Database layer for payment records
 * Uses SQLite for simplicity
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// PaymentRecord type definition
export interface PaymentRecord {
  txid: string;
  amount: number;
  proofHash: string;
  timestamp: number;
  confirmed: boolean;
}

export class Database {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const dbDir = join(__dirname, '../../data');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    this.dbPath = process.env.DATABASE_PATH || join(dbDir, 'payments.db');
  }

  init() {
    this.db = new Database(this.dbPath);
    
    // Create payments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        txid TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        proof_hash TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        confirmed INTEGER DEFAULT 0
      )
    `);

    // Create index for proof hash lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_proof_hash ON payments(proof_hash)
    `);
  }

  /**
   * Store a payment record
   */
  storePayment(payment: PaymentRecord) {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO payments (txid, amount, proof_hash, timestamp, confirmed)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      payment.txid,
      payment.amount,
      payment.proofHash,
      payment.timestamp,
      payment.confirmed ? 1 : 0
    );
  }

  /**
   * Get payment by transaction ID
   */
  getPaymentByTxId(txid: string): PaymentRecord | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM payments WHERE txid = ?');
    const row = stmt.get(txid) as any;
    
    if (!row) return null;
    
    return {
      txid: row.txid,
      amount: row.amount,
      proofHash: row.proof_hash,
      timestamp: row.timestamp,
      confirmed: row.confirmed === 1,
    };
  }

  /**
   * Get payment by proof hash
   */
  getPaymentByProofHash(proofHash: string): PaymentRecord | null {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM payments WHERE proof_hash = ?');
    const row = stmt.get(proofHash) as any;
    
    if (!row) return null;
    
    return {
      txid: row.txid,
      amount: row.amount,
      proofHash: row.proof_hash,
      timestamp: row.timestamp,
      confirmed: row.confirmed === 1,
    };
  }

  /**
   * Update payment confirmation status
   */
  updateConfirmation(txid: string, confirmed: boolean) {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('UPDATE payments SET confirmed = ? WHERE txid = ?');
    stmt.run(confirmed ? 1 : 0, txid);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

