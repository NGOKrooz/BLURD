/**
 * Payment Record Management
 * Standardized payment record format with cryptographic signatures
 */

import { verifyMessage } from 'viem';

export interface PaymentRecord {
  paymentId: string; // UUID
  from: string; // Sender address (0x...)
  to: string; // Recipient address (0x...)
  amount: string; // Amount as string (e.g., "0.05")
  token: string; // Token symbol (e.g., "MATIC")
  timestamp: number; // Unix timestamp (seconds)
  proofHash?: string; // Optional proof hash (0x...)
  simSignature?: string; // Wallet-signed message proving the payment record (0x...)
}

export interface PaymentStatus {
  status: 'pending' | 'confirmed' | 'bound';
  proofType?: string;
  verification: 'valid' | 'invalid' | 'pending';
}

/**
 * Create a canonical message from payment record (for signing)
 * This ensures the signature can be verified later
 */
export function createPaymentMessage(payment: Omit<PaymentRecord, 'simSignature'>): string {
  const parts = [
    payment.paymentId,
    payment.from.toLowerCase(),
    payment.to.toLowerCase(),
    payment.amount,
    payment.token,
    payment.timestamp.toString(),
    payment.proofHash || '',
  ];
  return `Blurd Payment Record\n\nPayment ID: ${parts[0]}\nFrom: ${parts[1]}\nTo: ${parts[2]}\nAmount: ${parts[3]} ${parts[4]}\nTimestamp: ${parts[5]}${parts[6] ? `\nProof Hash: ${parts[6]}` : ''}`;
}

/**
 * Sign payment record with wallet
 * Uses wallet.signMessage (via wagmi)
 */
export async function signPaymentRecord(
  payment: Omit<PaymentRecord, 'simSignature'>,
  signMessage: (message: string) => Promise<`0x${string}`>
): Promise<PaymentRecord> {
  const message = createPaymentMessage(payment);
  const signature = await signMessage(message);
  
  return {
    ...payment,
    simSignature: signature,
  };
}

/**
 * Verify payment record signature
 * Checks that simSignature recovers from the 'from' address
 */
export async function verifyPaymentSignature(
  payment: PaymentRecord
): Promise<boolean> {
  if (!payment.simSignature || !payment.from) {
    return false;
  }

  try {
    const message = createPaymentMessage(payment);
    const fromAddr: string = payment.from;
    const recoveredAddress: any = await verifyMessage({
      address: fromAddr as `0x${string}`,
      message,
      signature: payment.simSignature as `0x${string}`,
    });

    if (typeof recoveredAddress !== 'string' || typeof fromAddr !== 'string') {
      return false;
    }
    
    return (recoveredAddress as string).toLowerCase() === fromAddr.toLowerCase();
  } catch (error) {
    console.error('Payment signature verification error:', error);
    return false;
  }
}

/**
 * Verify proofHash exists in local storage
 * Checks if the proofHash corresponds to an existing local proof
 */
export function verifyProofHash(proofHash?: string): boolean {
  if (!proofHash) {
    return true; // No proof hash is valid (optional field)
  }

  try {
    const stored = localStorage.getItem('blurd_proofs');
    if (!stored) {
      return false;
    }

    const proofs = JSON.parse(stored);
    return proofs.some((proof: any) => proof.proofHash === proofHash);
  } catch (error) {
    console.error('Proof hash verification error:', error);
    return false;
  }
}

/**
 * Check timestamp freshness
 * Timestamp should be within reasonable time window (24 hours for MVP)
 */
export function checkTimestampFreshness(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  const maxAge = 86400; // 24 hours
  return age >= 0 && age < maxAge;
}

/**
 * Verify complete payment record
 * Checks signature, proofHash, and timestamp
 */
export async function verifyPaymentRecord(
  payment: PaymentRecord
): Promise<{
  valid: boolean;
  signatureValid: boolean;
  proofHashValid: boolean;
  timestampValid: boolean;
  error?: string;
}> {
  const signatureValid = await verifyPaymentSignature(payment);
  const proofHashValid = verifyProofHash(payment.proofHash);
  const timestampValid = checkTimestampFreshness(payment.timestamp);

  const valid = signatureValid && proofHashValid && timestampValid;

  let error: string | undefined;
  if (!signatureValid) {
    error = 'Invalid payment signature';
  } else if (!proofHashValid && payment.proofHash) {
    error = 'Proof hash does not correspond to an existing proof';
  } else if (!timestampValid) {
    error = 'Payment timestamp is too old or invalid';
  }

  return {
    valid,
    signatureValid,
    proofHashValid,
    timestampValid,
    error,
  };
}

/**
 * Get payment status for UI display
 * Also looks up proof type from localStorage if proofHash is present
 */
export function getPaymentStatus(payment: PaymentRecord): PaymentStatus {
  if (!payment.simSignature) {
    return {
      status: 'pending',
      verification: 'pending',
    };
  }

  // Check if proof is bound
  if (payment.proofHash) {
    // Try to determine proof type from localStorage
    let proofType = 'Unknown';
    try {
      const stored = localStorage.getItem('blurd_proofs');
      if (stored) {
        const proofs = JSON.parse(stored);
        const proof = proofs.find((p: any) => p.proofHash === payment.proofHash);
        if (proof && proof.circuitType) {
          proofType = proof.circuitType;
        }
      }
    } catch (error) {
      console.error('Error looking up proof type:', error);
    }

    return {
      status: 'bound',
      proofType,
      verification: 'valid', // Would be determined by actual verification
    };
  }

  return {
    status: 'confirmed',
    verification: 'valid',
  };
}

/**
 * Generate UUID for payment ID
 */
export function generatePaymentId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


