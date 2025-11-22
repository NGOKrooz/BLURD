/**
 * Combined Proof Verification
 * Verifies both identity proof and payment proof together
 * Includes proofHash binding validation
 */

import { verifyProof, ProofData, hashProof } from './proof';
import { verifyZcashPaymentProof, ZcashPaymentProof } from './zcash';
import { verifyPaymentRecord, type PaymentRecord } from '../payment';

export interface CombinedProofResult {
  identityValid: boolean;
  paymentValid: boolean;
  proofHashMatches: boolean;
  overall: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Verify combined identity + payment proof
 * 
 * @param identityProof - The identity proof (age, country, uniqueness, etc.)
 * @param paymentProof - Either a ZcashPaymentProof (legacy) or PaymentRecord (new format)
 * @param requiredAmount - Optional minimum payment amount
 * @param requireBinding - If true, requires proofHash to match between proof and payment
 */
export async function verifyCombined(
  identityProof: {
    proof: ProofData['proof'];
    publicSignals: string[];
    circuitType: 'age18' | 'uniqueness' | 'credential' | 'country';
    proofHash?: string; // Optional proof hash for binding validation
  },
  paymentProof: ZcashPaymentProof | PaymentRecord,
  requiredAmount?: number,
  requireBinding: boolean = true
): Promise<CombinedProofResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Verify identity proof
  let identityValid = false;
  let identityProofHash: string | undefined;
  
  try {
    identityValid = await verifyProof(
      identityProof.proof,
      identityProof.publicSignals,
      identityProof.circuitType
    );
    
    if (!identityValid) {
      errors.push('Identity proof verification failed');
    } else {
      // Compute proof hash if not provided
      if (identityProof.proofHash) {
        identityProofHash = identityProof.proofHash;
      } else {
        const proofData: ProofData = {
          proof: identityProof.proof,
          publicSignals: identityProof.publicSignals,
        };
        identityProofHash = await hashProof(proofData);
      }
    }
  } catch (error: any) {
    errors.push(`Identity proof error: ${error.message}`);
    console.error('Identity proof verification error:', error);
  }

  // Step 2: Verify payment proof
  let paymentValid = false;
  let paymentProofHash: string | undefined;
  let proofHashMatches = false;

  // Check if payment is new format (PaymentRecord) or legacy (ZcashPaymentProof)
  const isPaymentRecord = 'paymentId' in paymentProof && 'simSignature' in paymentProof;
  
  if (isPaymentRecord) {
    // New format: PaymentRecord with signature
    try {
      const paymentRecord = paymentProof as PaymentRecord;
      const verification = await verifyPaymentRecord(paymentRecord);
      
      paymentValid = verification.valid;
      paymentProofHash = paymentRecord.proofHash;
      
      if (!paymentValid) {
        errors.push(verification.error || 'Payment record verification failed');
        if (!verification.signatureValid) {
          errors.push('Payment signature is invalid');
        }
        if (!verification.proofHashValid && paymentRecord.proofHash) {
          errors.push('Payment proof hash does not correspond to an existing proof');
        }
        if (!verification.timestampValid) {
          errors.push('Payment timestamp is too old or invalid');
        }
      }
    } catch (error: any) {
      errors.push(`Payment record verification error: ${error.message}`);
      console.error('Payment record verification error:', error);
    }
  } else {
    // Legacy format: ZcashPaymentProof
    try {
      const zcashProof = paymentProof as ZcashPaymentProof;
      const paymentResult = await verifyZcashPaymentProof(zcashProof, requiredAmount);
      paymentValid = paymentResult.paymentVerified;
      
      // Extract proof hash from memo if available
      if (zcashProof.memo) {
        paymentProofHash = zcashProof.memo;
      }
      
      if (!paymentValid) {
        errors.push(paymentResult.error || 'Payment proof verification failed');
        if (!paymentResult.signatureValid) {
          errors.push('Payment signature is invalid');
        }
        if (!paymentResult.amountValid && requiredAmount) {
          errors.push(`Payment amount ${zcashProof.amount} is less than required ${requiredAmount}`);
        }
      }
    } catch (error: any) {
      errors.push(`Payment proof verification error: ${error.message}`);
      console.error('Payment proof verification error:', error);
    }
  }

  // Step 3: Verify proofHash binding (if both are available)
  if (requireBinding && identityProofHash && paymentProofHash) {
    proofHashMatches = identityProofHash.toLowerCase() === paymentProofHash.toLowerCase();
    
    if (!proofHashMatches) {
      errors.push(`Proof hash mismatch: identity proof hash (${identityProofHash.substring(0, 16)}...) does not match payment proof hash (${paymentProofHash.substring(0, 16)}...)`);
    }
  } else if (requireBinding && identityProofHash && !paymentProofHash) {
    warnings.push('Payment proof does not include proof hash - binding cannot be verified');
  } else if (requireBinding && !identityProofHash && paymentProofHash) {
    warnings.push('Identity proof hash not available - binding cannot be verified');
  }

  // Step 4: Determine overall validity
  const overall = identityValid && paymentValid && (!requireBinding || proofHashMatches);

  return {
    identityValid,
    paymentValid,
    proofHashMatches,
    overall,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

