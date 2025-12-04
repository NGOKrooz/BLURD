/**
 * Payment Proof File Generator
 * Creates a privacy-preserving proof file that combines identity proof + payment commitment
 * For sharing with merchants/verifiers without revealing sensitive data
 */

/**
 * Payment Proof File Structure
 * Contains ZK identity proof + payment commitment
 * NO sensitive data (wallet address, amount, recipient) is included
 */
export interface PaymentProofFile {
  version: string;
  identityProof: IdentityProofData | null;
  commitment: string;
  nonce: string;
  note: string;
  purpose: string;
  generatedAt: string;
  network: string;
}

/**
 * Identity Proof Data (ZK proof reference)
 * Only contains the proof hash and type, not the actual proof details
 */
export interface IdentityProofData {
  type: 'age' | 'nationality' | 'uniqueness' | null;
  proofHash: string | null;
  verified: boolean;
  message: string;
}

/**
 * Get stored identity proof from localStorage
 * Returns the most recent proof of the specified type
 */
export function getIdentityProof(proofType?: 'age' | 'nationality' | 'uniqueness' | null): IdentityProofData {
  try {
    const stored = localStorage.getItem('blurd_proofs');
    if (!stored) {
      return {
        type: null,
        proofHash: null,
        verified: false,
        message: 'No identity proof available',
      };
    }

    const proofs = JSON.parse(stored);
    if (!proofs || proofs.length === 0) {
      return {
        type: null,
        proofHash: null,
        verified: false,
        message: 'No identity proof available',
      };
    }

    // Map proof type to circuit type
    const circuitTypeMap: Record<string, string> = {
      age: 'age18',
      nationality: 'country',
      uniqueness: 'uniqueness',
    };

    // If proofType specified, find matching proof
    if (proofType) {
      const circuitType = circuitTypeMap[proofType];
      const matchingProof = proofs.find((p: any) => p.circuitType === circuitType);
      
      if (matchingProof) {
        return {
          type: proofType,
          proofHash: matchingProof.proofHash || null,
          verified: true,
          message: `Identity verified: ${proofType} proof confirmed`,
        };
      }
    }

    // Return most recent proof
    const latestProof = proofs[proofs.length - 1];
    const reverseMap: Record<string, 'age' | 'nationality' | 'uniqueness'> = {
      age18: 'age',
      country: 'nationality',
      uniqueness: 'uniqueness',
    };

    return {
      type: reverseMap[latestProof.circuitType] || null,
      proofHash: latestProof.proofHash || null,
      verified: true,
      message: `Identity verified: ${reverseMap[latestProof.circuitType] || 'unknown'} proof confirmed`,
    };
  } catch (error) {
    console.error('Error getting identity proof:', error);
    return {
      type: null,
      proofHash: null,
      verified: false,
      message: 'Failed to retrieve identity proof',
    };
  }
}

/**
 * Create a Payment Proof File
 * Combines identity proof + payment commitment for privacy-preserving verification
 */
export function createPaymentProofFile(
  commitment: string,
  nonce: string,
  proofType?: 'age' | 'nationality' | 'uniqueness' | null
): PaymentProofFile {
  const identityProof = getIdentityProof(proofType);

  return {
    version: '1.0',
    identityProof,
    commitment,
    nonce,
    note: 'This proof confirms you are the legitimate sender of a private payment.',
    purpose: 'Proof of private payment with identity verification',
    generatedAt: new Date().toISOString(),
    network: 'starknet-sepolia',
  };
}

/**
 * Download any file with specified content
 */
export function downloadFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Download Payment Proof File
 */
export function downloadPaymentProofFile(proofFile: PaymentProofFile): void {
  const content = JSON.stringify(proofFile, null, 2);
  const timestamp = Date.now();
  downloadFile(`payment-proof-${timestamp}.json`, content);
}

/**
 * Store payment proof file reference in localStorage
 */
export function storePaymentProofFileRef(proofFile: PaymentProofFile): void {
  try {
    const stored = localStorage.getItem('blurd_payment_proof_files');
    const files = stored ? JSON.parse(stored) : [];
    files.push({
      ...proofFile,
      storedAt: new Date().toISOString(),
    });
    localStorage.setItem('blurd_payment_proof_files', JSON.stringify(files));
  } catch (error) {
    console.error('Error storing payment proof file reference:', error);
  }
}

/**
 * Load stored payment proof file references
 */
export function loadPaymentProofFileRefs(): PaymentProofFile[] {
  try {
    const stored = localStorage.getItem('blurd_payment_proof_files');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading payment proof file references:', error);
    return [];
  }
}

/**
 * Verify a payment proof file structure
 */
export function verifyPaymentProofFileStructure(proofFile: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!proofFile) {
    return { valid: false, errors: ['Payment proof file is missing'] };
  }

  if (proofFile.version !== '1.0') {
    errors.push('Invalid version (must be "1.0")');
  }

  if (!proofFile.commitment || typeof proofFile.commitment !== 'string') {
    errors.push('Missing or invalid commitment');
  }

  if (!proofFile.nonce || typeof proofFile.nonce !== 'string') {
    errors.push('Missing or invalid nonce');
  }

  if (!proofFile.purpose || typeof proofFile.purpose !== 'string') {
    errors.push('Missing or invalid purpose');
  }

  if (!proofFile.generatedAt || typeof proofFile.generatedAt !== 'string') {
    errors.push('Missing or invalid generatedAt timestamp');
  }

  // Ensure NO sensitive fields are present
  const sensitiveFields = [
    'walletAddress',
    'senderAddress',
    'recipientAddress',
    'amount',
    'txHash',
    'transactionHash',
    'privateKey',
    'secret',
  ];

  for (const field of sensitiveFields) {
    if (proofFile[field] !== undefined) {
      errors.push(`Privacy violation: sensitive field "${field}" found in proof file`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

