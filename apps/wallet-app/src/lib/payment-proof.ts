/**
 * Privacy-Preserving Payment Proof Utilities
 * Handles payment-proof.json generation and verification with zero-knowledge privacy
 * NO sensitive data (addresses, hashes, timestamps) are exposed in proofs
 */

import { keccak256, stringToBytes } from 'viem';

/**
 * Privacy-Preserving Payment Proof Format
 * This format contains NO sensitive payment data
 */
export interface PrivacyPreservingPaymentProof {
  version: string; // "1.0"
  proofType: 'payment';
  zkPaymentHash: string; // keccak256(internalId + amount + timestamp + proofHash) - opaque identifier
  zkProofHash: string | null; // Identity proof hash (keccak256(proof.type + proof.output))
  amountVerified: boolean; // Whether amount matches requirement
  signatureVerified: boolean; // Whether signature is valid
  timestampVerified: boolean; // Whether timestamp is valid
  publicMetadata: {
    requiredAmount: number | null; // Required amount (if specified by merchant)
    paymentMethod: string; // e.g., "simulated-matic"
  };
}

/**
 * Internal Payment Data (never exposed in proof JSON)
 * Stored locally for sender reference only
 */
export interface InternalPaymentData {
  internalId: string; // Internal payment ID
  recipient: string; // Recipient address (PRIVATE - never in proof)
  amount: string; // Amount (PRIVATE - never in proof)
  timestamp: number; // Unix timestamp (PRIVATE - never in proof)
  proofType: 'age' | 'nationality' | 'uniqueness' | null;
  proofHash: string | null;
  txHash: string; // Transaction hash (PRIVATE - never in proof)
  signature: string; // Signature (PRIVATE - never in proof)
}

export interface ProofBinding {
  type: 'age' | 'nationality' | 'uniqueness';
  output: string; // Public signal output or merkle root
}

/**
 * Calculate identity proof hash using keccak256
 * Formula: keccak256(proof.type + proof.output)
 */
export function calculateProofHash(binding: ProofBinding): string {
  const combined = `${binding.type}${binding.output}`;
  const hash = keccak256(stringToBytes(combined));
  return hash;
}

/**
 * Calculate privacy-preserving payment hash
 * Formula: keccak256(JSON.stringify({ internalId, amount, timestamp, proofHash }))
 * This creates an opaque identifier that doesn't reveal payment details
 */
export function calculateZkPaymentHash(data: {
  internalId: string;
  amount: string;
  timestamp: number;
  proofHash: string | null;
}): string {
  const combined = JSON.stringify({
    internalId: data.internalId,
    amount: data.amount,
    timestamp: data.timestamp,
    proofHash: data.proofHash || null,
  });
  const hash = keccak256(stringToBytes(combined));
  return hash;
}

/**
 * Generate internal payment ID
 */
export function generateInternalPaymentId(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const hashArray = Array.from(randomBytes);
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate simulated transaction hash (internal use only)
 */
export function generateSimulatedTxHash(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const hashArray = Array.from(randomBytes);
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate simulated signature (internal use only)
 */
export function generateSimulatedSignature(): string {
  const randomBytes = new Uint8Array(65);
  crypto.getRandomValues(randomBytes);
  const sigArray = Array.from(randomBytes);
  return '0x' + sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create internal payment data (for local storage only)
 */
export function createInternalPaymentData(data: {
  recipient: string;
  amount: string;
  proofType?: 'age' | 'nationality' | 'uniqueness' | null;
  proofHash?: string | null;
}): InternalPaymentData {
  const timestamp = Math.floor(Date.now() / 1000);
  const internalId = generateInternalPaymentId();

  return {
    internalId,
    recipient: data.recipient,
    amount: data.amount,
    timestamp,
    proofType: data.proofType || null,
    proofHash: data.proofHash || null,
    txHash: generateSimulatedTxHash(),
    signature: generateSimulatedSignature(),
  };
}

/**
 * Create privacy-preserving payment proof (for sharing with merchants)
 * This is the ONLY format that should be shared - contains NO sensitive data
 */
export function createPrivacyPreservingPaymentProof(
  internalData: InternalPaymentData,
  requiredAmount?: number | null
): PrivacyPreservingPaymentProof {
  // Calculate privacy-preserving payment hash
  const zkPaymentHash = calculateZkPaymentHash({
    internalId: internalData.internalId,
    amount: internalData.amount,
    timestamp: internalData.timestamp,
    proofHash: internalData.proofHash,
  });

  // Validate amount matches requirement
  const amountVerified = requiredAmount === null || requiredAmount === undefined
    ? true // No requirement means verified
    : Math.abs(parseFloat(internalData.amount) - requiredAmount) < 0.0001;

  // Validate timestamp (within 24 hours)
  const now = Math.floor(Date.now() / 1000);
  const age = now - internalData.timestamp;
  const timestampVerified = age >= 0 && age <= 86400;

  // Validate signature format
  const signatureVerified = internalData.signature.startsWith('0x') && internalData.signature.length === 132;

  return {
    version: '1.0',
    proofType: 'payment',
    zkPaymentHash,
    zkProofHash: internalData.proofHash,
    amountVerified,
    signatureVerified,
    timestampVerified,
    publicMetadata: {
      requiredAmount: requiredAmount || null,
      paymentMethod: 'simulated-matic',
    },
  };
}

/**
 * Download privacy-preserving payment proof (for merchant sharing)
 */
export function downloadPaymentProof(
  proof: PrivacyPreservingPaymentProof,
  filename?: string
): void {
  const blob = new Blob([JSON.stringify(proof, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `payment-proof_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Store internal payment data locally (for sender reference)
 */
export function storeInternalPaymentData(data: InternalPaymentData): void {
  try {
    const stored = localStorage.getItem('blurd_internal_payments');
    const payments = stored ? JSON.parse(stored) : [];
    payments.push(data);
    localStorage.setItem('blurd_internal_payments', JSON.stringify(payments));
  } catch (error) {
    console.error('Error storing internal payment data:', error);
  }
}

/**
 * Store privacy-preserving payment proof locally
 */
export function storePaymentProof(proof: PrivacyPreservingPaymentProof): void {
  try {
    const stored = localStorage.getItem('blurd_payment_proofs');
    const proofs = stored ? JSON.parse(stored) : [];
    proofs.push(proof);
    localStorage.setItem('blurd_payment_proofs', JSON.stringify(proofs));
  } catch (error) {
    console.error('Error storing payment proof:', error);
  }
}

/**
 * Load internal payment data from localStorage
 */
export function loadInternalPaymentData(): InternalPaymentData[] {
  try {
    const stored = localStorage.getItem('blurd_internal_payments');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading internal payment data:', error);
    return [];
  }
}

/**
 * Load payment proofs from localStorage
 */
export function loadPaymentProofs(): PrivacyPreservingPaymentProof[] {
  try {
    const stored = localStorage.getItem('blurd_payment_proofs');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading payment proofs:', error);
    return [];
  }
}

/**
 * Verify privacy-preserving payment proof structure
 */
export function verifyPaymentProofStructure(proof: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!proof) {
    return { valid: false, errors: ['Payment proof is missing'] };
  }

  // Check version
  if (proof.version !== '1.0') {
    errors.push('Invalid proof version (must be "1.0")');
  }

  // Check proofType
  if (proof.proofType !== 'payment') {
    errors.push('Invalid proof type (must be "payment")');
  }

  // Check zkPaymentHash
  if (!proof.zkPaymentHash || typeof proof.zkPaymentHash !== 'string') {
    errors.push('Missing or invalid zkPaymentHash');
  } else if (!proof.zkPaymentHash.startsWith('0x') || proof.zkPaymentHash.length !== 66) {
    errors.push('Invalid zkPaymentHash format (must be 0x-prefixed hex string, 66 chars)');
  }

  // Check zkProofHash (optional but must be valid if present)
  if (proof.zkProofHash !== null && proof.zkProofHash !== undefined) {
    if (typeof proof.zkProofHash !== 'string') {
      errors.push('Invalid zkProofHash (must be string or null)');
    } else if (!proof.zkProofHash.startsWith('0x') || proof.zkProofHash.length !== 66) {
      errors.push('Invalid zkProofHash format (must be 0x-prefixed hex string, 66 chars)');
    }
  }

  // Check verification flags
  if (typeof proof.amountVerified !== 'boolean') {
    errors.push('Missing or invalid amountVerified (must be boolean)');
  }
  if (typeof proof.signatureVerified !== 'boolean') {
    errors.push('Missing or invalid signatureVerified (must be boolean)');
  }
  if (typeof proof.timestampVerified !== 'boolean') {
    errors.push('Missing or invalid timestampVerified (must be boolean)');
  }

  // Check publicMetadata
  if (!proof.publicMetadata || typeof proof.publicMetadata !== 'object') {
    errors.push('Missing or invalid publicMetadata');
  } else {
    if (proof.publicMetadata.requiredAmount !== null && typeof proof.publicMetadata.requiredAmount !== 'number') {
      errors.push('Invalid requiredAmount in publicMetadata (must be number or null)');
    }
    if (!proof.publicMetadata.paymentMethod || typeof proof.publicMetadata.paymentMethod !== 'string') {
      errors.push('Missing or invalid paymentMethod in publicMetadata');
    }
  }

  // Ensure NO sensitive fields are present
  const sensitiveFields = ['recipient', 'txHash', 'timestamp', 'amount', 'signature', 'toAddress', 'fromAddress', 'transactionHash'];
  for (const field of sensitiveFields) {
    if (proof[field] !== undefined) {
      errors.push(`Privacy violation: sensitive field "${field}" found in proof (must be removed)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verify privacy-preserving payment proof
 * Returns validation results without exposing sensitive data
 * 
 * Note: Since we don't store timestamps in the proof for privacy,
 * we trust the timestampVerified flag that was set at creation time.
 * Merchants should verify proofs soon after receiving them.
 */
export function verifyPaymentProof(
  proof: PrivacyPreservingPaymentProof,
  requiredAmount?: number
): {
  paymentVerified: boolean;
  amountValid: boolean;
  signatureValid: boolean;
  proofHashValid: boolean;
  timestampValid: boolean;
  error?: string;
} {
  // Structure validation
  const structureCheck = verifyPaymentProofStructure(proof);
  if (!structureCheck.valid) {
    return {
      paymentVerified: false,
      amountValid: false,
      signatureValid: false,
      proofHashValid: false,
      timestampValid: false,
      error: structureCheck.errors.join(', '),
    };
  }

  // Use verification flags from proof (already computed at creation time)
  // These flags were set when the proof was created, indicating validity at that time
  const amountValid = proof.amountVerified;
  const signatureValid = proof.signatureVerified;
  // Read timestampVerified from the proof (it's stored as timestampVerified, not timestampValid)
  const timestampValid = proof.timestampVerified === true;

  // Check if amount matches requirement (if specified)
  if (requiredAmount !== undefined && proof.publicMetadata.requiredAmount !== null) {
    if (Math.abs(proof.publicMetadata.requiredAmount - requiredAmount) > 0.0001) {
      return {
        paymentVerified: false,
        amountValid: false,
        signatureValid,
        timestampValid,
        proofHashValid: true,
        error: 'Amount mismatch: proof requiredAmount does not match merchant requirement',
      };
    }
  }

  // Proof hash validation (format check only)
  const proofHashValid = proof.zkProofHash === null || (
    proof.zkProofHash.startsWith('0x') && proof.zkProofHash.length === 66
  );

  const paymentVerified = amountValid && signatureValid && timestampValid && proofHashValid;

  let error: string | undefined;
  if (!paymentVerified) {
    const errors: string[] = [];
    if (!amountValid) errors.push('Amount verification failed');
    if (!signatureValid) errors.push('Signature verification failed');
    if (!timestampValid) errors.push('Timestamp verification failed (proof expired)');
    if (!proofHashValid) errors.push('Proof hash format invalid');
    error = errors.join(', ');
  }

  return {
    paymentVerified,
    amountValid,
    signatureValid,
    timestampValid,
    proofHashValid,
    error,
  };
}

/**
 * Check if old proof format (with sensitive data) and reject it
 */
export function isOldProofFormat(proof: any): boolean {
  return !!(
    proof.recipient ||
    proof.txHash ||
    proof.transactionHash ||
    proof.toAddress ||
    proof.fromAddress ||
    (proof.timestamp && typeof proof.timestamp === 'number' && proof.timestamp > 1000000000)
  );
}
