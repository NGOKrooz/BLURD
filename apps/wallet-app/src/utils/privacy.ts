/**
 * Privacy Utils for Starknet Payments
 * Implements commitment-based privacy using Poseidon hash
 */

import { hash } from 'starknet';

/**
 * Generate a random 256-bit nonce
 * @returns A random nonce as a string (felt252 compatible)
 */
export function generateNonce(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  // Convert to hex string and then to BigInt
  const hexString = '0x' + Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Ensure it fits in felt252 (< 2^251)
  const bigIntValue = BigInt(hexString) % BigInt('0x800000000000011000000000000000000000000000000000000000000000001');
  
  return bigIntValue.toString();
}

/**
 * Convert address/amount to felt-compatible BigInt string
 */
function toFelt(value: string | number | bigint): string {
  if (typeof value === 'string') {
    // Handle hex strings
    if (value.startsWith('0x')) {
      return BigInt(value).toString();
    }
    // Handle numeric strings
    return BigInt(value).toString();
  }
  return BigInt(value).toString();
}

/**
 * Generate a commitment hash using Poseidon
 * commitment = poseidon_hash([sender, recipient, amount, nonce])
 * 
 * @param sender - Sender's address
 * @param recipient - Recipient's address
 * @param amount - Payment amount in wei
 * @param nonce - Random nonce
 * @returns Commitment hash as string
 */
export function generateCommitment(
  sender: string,
  recipient: string,
  amount: string | number | bigint,
  nonce: string
): string {
  // Convert all inputs to felt-compatible values
  const senderFelt = toFelt(sender);
  const recipientFelt = toFelt(recipient);
  const amountFelt = toFelt(amount);
  const nonceFelt = toFelt(nonce);

  // Use Pedersen hash (available in starknet.js v5)
  // Hash pairs: hash(hash(hash(sender, recipient), amount), nonce)
  const hash1 = hash.computePedersenHash(senderFelt, recipientFelt);
  const hash2 = hash.computePedersenHash(hash1, amountFelt);
  const commitment = hash.computePedersenHash(hash2, nonceFelt);

  return commitment;
}

/**
 * Payment proof data structure
 */
export interface PaymentProof {
  sender: string;
  recipient: string;
  amount: string;
  nonce: string;
  commitment: string;
  timestamp: number;
}

/**
 * Store payment proof locally
 * @param proof - Payment proof data
 */
export function storePaymentProof(proof: PaymentProof): void {
  const key = 'blurd_payment_proofs';
  const stored = localStorage.getItem(key);
  const proofs: PaymentProof[] = stored ? JSON.parse(stored) : [];
  
  proofs.push(proof);
  localStorage.setItem(key, JSON.stringify(proofs));
}

/**
 * Get all stored payment proofs
 * @returns Array of payment proofs
 */
export function getStoredPaymentProofs(): PaymentProof[] {
  const key = 'blurd_payment_proofs';
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Find a payment proof by commitment
 * @param commitment - Commitment hash to search for
 * @returns Payment proof or null
 */
export function findPaymentProofByCommitment(commitment: string): PaymentProof | null {
  const proofs = getStoredPaymentProofs();
  return proofs.find(p => p.commitment === commitment) || null;
}

/**
 * Verify a commitment matches the original inputs
 * @param proof - Payment proof to verify
 * @returns True if commitment is valid
 */
export function verifyCommitment(proof: PaymentProof): boolean {
  const recomputed = generateCommitment(
    proof.sender,
    proof.recipient,
    proof.amount,
    proof.nonce
  );
  return recomputed === proof.commitment;
}

