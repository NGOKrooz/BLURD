// Blurd - Shared Utilities

import { createHash } from 'crypto';

/**
 * Compute SHA256 hash of a JSON object
 */
export function hashProof(proof: any): string {
  const proofString = JSON.stringify(proof);
  return createHash('sha256').update(proofString).digest('hex');
}

/**
 * Format ZEC amount for display
 */
export function formatZEC(amount: number): string {
  return `${amount.toFixed(8)} ZEC`;
}

/**
 * Validate proof hash format
 */
export function isValidProofHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Validate transaction ID format
 */
export function isValidTxId(txId: string): boolean {
  return /^[a-f0-9]{64}$/i.test(txId);
}

/**
 * Generate a random secret for ZK proofs
 */
export function generateSecret(): string {
  return createHash('sha256')
    .update(Math.random().toString() + Date.now().toString())
    .digest('hex');
}

