/**
 * Circom/SnarkJS Verifier Integration (stub)
 *
 * In this dashboard build, proof verification is delegated to the API.
 * These functions intentionally throw to signal callers to fall back to API verification.
 */

export async function initCircomVerifier(): Promise<void> {
  throw new Error('SnarkJS verifier not available in this environment');
}

/**
 * Verify a zero-knowledge proof
 * 
 * @param proof - The proof JSON object (GroTH16 format)
 * @param publicInputs - Array of public inputs (should contain result)
 * @returns true if proof is valid, false otherwise
 */
export async function verifyProof(
  proof: any,
  publicInputs: string[]
): Promise<{
  valid: boolean;
  error?: string;
}> {
  throw new Error('SnarkJS verifier not available in this environment');
}

/**
 * Validate proof structure
 */
export function validateProofStructure(proof: any): {
  valid: boolean;
  error?: string;
} {
  if (!proof) {
    return { valid: false, error: 'Proof is required' };
  }

  if (typeof proof !== 'object') {
    return { valid: false, error: 'Proof must be a JSON object' };
  }

  // Check for Groth16 proof structure
  if (!proof.pi_a || !proof.pi_b || !proof.pi_c) {
    return { valid: false, error: 'Invalid proof structure. Missing pi_a, pi_b, or pi_c' };
  }

  return { valid: true };
}

/**
 * Validate public inputs structure
 */
export function validatePublicInputs(publicInputs: any): {
  valid: boolean;
  error?: string;
} {
  if (!publicInputs) {
    return { valid: false, error: 'Public inputs are required' };
  }

  if (!Array.isArray(publicInputs)) {
    return { valid: false, error: 'Public inputs must be an array' };
  }

  if (publicInputs.length === 0) {
    return { valid: false, error: 'Public inputs cannot be empty' };
  }

  return { valid: true };
}

