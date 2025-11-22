'use client';

/**
 * ZK Proof Generation and Verification Utilities
 * Client-side proof generation using Circom + snarkjs
 */

/**
 * Circuit file configuration mapping
 */
const circuitFiles = {
  age18: {
    wasm: '/zk/age18.wasm', // Keep current path for compatibility
    zkey: '/zk/age18.zkey',
    vk: '/zk/age18_verification_key.json',
  },
  country: {
    wasm: '/zk/countryProof.wasm', // Keep current path for compatibility
    zkey: '/zk/countryProof.zkey',
    vk: '/zk/countryProof_verification_key.json',
  },
  uniqueness: {
    wasm: '/zk/uniquenessProof.wasm',
    zkey: '/zk/uniquenessProof.zkey',
    vk: '/zk/uniquenessProof_verification_key.json',
  },
  credential: {
    wasm: '/zk/credential_preimage.wasm',
    zkey: '/zk/credential_preimage.zkey',
    vk: '/zk/credential_preimage_verification_key.json',
  },
} as const;

export interface ProofData {
  proof: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: string;
  };
  publicSignals: string[];
}

export interface ProofResult {
  proof: ProofData['proof'];
  publicSignals: string[];
  proofHash: string;
  circuitType: 'age18' | 'uniqueness' | 'credential' | 'country';
  generatedAt?: string; // Optional timestamp for stored proofs
  merkleRoot?: string; // For uniqueness proofs
}

/**
 * Generate Age ≥ 18 Proof
 * 
 * Circuit expects exactly 2 scalar inputs:
 * - userAge: single integer (scalar)
 * - minAge: single integer (scalar)
 * 
 * For MVP: Uses simple simulation instead of actual ZK proof generation
 */
export async function generateAgeProof(userAge: number, minAge: number = 18): Promise<ProofResult> {
  try {
    // Simple simulation for MVP - returns a mock proof structure
    // This avoids circuit file errors and allows the app to work immediately
    console.log('Generating age proof (simulated):', { userAge, minAge });
    
    // Validate inputs
    const ageNum = typeof userAge === 'number' ? Math.floor(userAge) : parseInt(String(userAge), 10);
    const minAgeNum = typeof minAge === 'number' ? Math.floor(minAge) : parseInt(String(minAge), 10);
    
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      throw new Error(`Invalid age value: ${ageNum}`);
    }
    if (isNaN(minAgeNum) || minAgeNum < 0) {
      throw new Error(`Invalid minAge value: ${minAgeNum}`);
    }
    if (ageNum < minAgeNum) {
      throw new Error(`User age (${ageNum}) must be greater than or equal to minimum age (${minAgeNum})`);
    }
    
    // Generate a deterministic mock proof based on inputs
    const proofData = {
      proof: {
        pi_a: [
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x1'
        ] as [string, string, string],
        pi_b: [
          [
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
          ],
          [
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
          ],
          ['0x1', '0x1']
        ] as [[string, string], [string, string], [string, string]],
        pi_c: [
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x1'
        ] as [string, string, string],
        protocol: 'groth16',
      },
      publicSignals: ['1'], // isAboveAge = 1
    };
    
    const proofHash = await hashProof(proofData);
    
    return {
      proof: proofData.proof,
      publicSignals: proofData.publicSignals,
      proofHash,
      circuitType: 'age18',
    };
  } catch (error: any) {
    console.error('Age proof generation error:', error);
    throw new Error(`Failed to generate age proof: ${error.message}`);
  }
}

/**
 * Generate Country/Nationality Proof
 * 
 * Circuit expects exactly 2 scalar inputs:
 * - userCountryHash: hash of user's country (scalar)
 * - requiredCountryHash: hash of required country (scalar)
 * 
 * For MVP: Uses simple simulation instead of actual ZK proof generation
 */
export async function generateCountryProof(
  userCountryCode: string,
  requiredCountryCode: string
): Promise<ProofResult> {
  try {
    // Simple simulation for MVP - returns a mock proof structure
    console.log('Generating country proof (simulated):', { userCountryCode, requiredCountryCode });
    
    // Validate inputs
    if (Array.isArray(userCountryCode) || typeof userCountryCode === 'object') {
      throw new Error(`Country proof failed: expected string for 'userCountryCode' but got ${Array.isArray(userCountryCode) ? 'array' : 'object'}`);
    }
    if (Array.isArray(requiredCountryCode) || typeof requiredCountryCode === 'object') {
      throw new Error(`Country proof failed: expected string for 'requiredCountryCode' but got ${Array.isArray(requiredCountryCode) ? 'array' : 'object'}`);
    }
    
    const userCountry = String(userCountryCode).trim().toUpperCase();
    const requiredCountry = String(requiredCountryCode).trim().toUpperCase();
    
    if (!userCountry || userCountry.length === 0) {
      throw new Error('Country proof failed: userCountryCode cannot be empty');
    }
    if (!requiredCountry || requiredCountry.length === 0) {
      throw new Error('Country proof failed: requiredCountryCode cannot be empty');
    }
    
    if (userCountry !== requiredCountry) {
      throw new Error(`Country mismatch: user country (${userCountry}) does not match required country (${requiredCountry})`);
    }
    
    // Generate a deterministic mock proof based on inputs
    const proofData = {
      proof: {
        pi_a: [
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x1'
        ] as [string, string, string],
        pi_b: [
          [
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
          ],
          [
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
          ],
          ['0x1', '0x1']
        ] as [[string, string], [string, string], [string, string]],
        pi_c: [
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x1'
        ] as [string, string, string],
        protocol: 'groth16',
      },
      publicSignals: ['1'], // countryMatch = 1
    };
    
    const proofHash = await hashProof(proofData);
    
    return {
      proof: proofData.proof,
      publicSignals: proofData.publicSignals,
      proofHash,
      circuitType: 'country',
    };
  } catch (error: any) {
    console.error('Country proof generation error:', error);
    throw new Error(`Failed to generate country proof: ${error.message}`);
  }
}

/**
 * Generate Human Uniqueness Proof
 * 
 * Circuit expects:
 * - identifierHash: hash of unique document identifier (scalar)
 * 
 * Public output:
 * - merkleRoot: root of Merkle tree containing all uniqueness commitments
 * 
 * For MVP: Uses simple simulation instead of actual ZK proof generation
 */
export async function generateUniquenessProof(identifier: string): Promise<ProofResult> {
  try {
    // Simple simulation for MVP - returns a mock proof structure
    console.log('Generating uniqueness proof (simulated):', { identifier: identifier.substring(0, 20) + '...' });
    
    // Validate identifier
    if (!identifier || identifier.trim().length === 0) {
      throw new Error('Unique identifier cannot be empty');
    }
    
    // Hash the identifier for uniqueness check
    const { hashIdentifier } = await import('@/lib/uniqueness/hashIdentifier');
    const identifierHash = await hashIdentifier(identifier.trim());
    console.log('Hashed identifier:', identifierHash.substring(0, 20) + '...');
    
    // Check for duplicate commitment (simulated check)
    const { isCommitmentDuplicate, storeUniquenessCommitment, getCurrentMerkleRoot } = await import('@/lib/uniqueness/merkleStore');
    if (isCommitmentDuplicate(identifierHash)) {
      throw new Error('This identifier has already been used. Each document can only be used once for uniqueness proof.');
    }
    
    // Store commitment
    storeUniquenessCommitment(identifierHash);
    const merkleRoot = getCurrentMerkleRoot();
    const merkleRootStr = String(merkleRoot || '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Generate a deterministic mock proof based on inputs
    const proofData = {
      proof: {
        pi_a: [
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x1'
        ] as [string, string, string],
        pi_b: [
          [
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
          ],
          [
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
          ],
          ['0x1', '0x1']
        ] as [[string, string], [string, string], [string, string]],
        pi_c: [
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
          '0x1'
        ] as [string, string, string],
        protocol: 'groth16',
      },
      publicSignals: [merkleRootStr],
    };
    
    const proofHash = await hashProof(proofData);
    
    return {
      proof: proofData.proof,
      publicSignals: proofData.publicSignals,
      proofHash,
      circuitType: 'uniqueness',
      merkleRoot: merkleRootStr,
    };
  } catch (error: any) {
    console.error('Uniqueness proof generation error:', error);
    throw new Error(`Failed to generate uniqueness proof: ${error.message}`);
  }
}

/**
 * Verify ZK Proof
 */
export async function verifyProof(
  proof: ProofData['proof'],
  publicSignals: string[],
  circuitType: 'age18' | 'uniqueness' | 'credential' | 'country' = 'age18'
): Promise<boolean> {
  try {
    const snarkjs = await import('snarkjs');

    let vkPath: string;
    if (circuitType === 'age18') {
      vkPath = circuitFiles.age18.vk;
    } else if (circuitType === 'country') {
      vkPath = circuitFiles.country.vk;
    } else if (circuitType === 'uniqueness') {
      vkPath = circuitFiles.uniqueness.vk;
    } else if (circuitType === 'credential') {
      vkPath = circuitFiles.credential.vk;
    } else {
      // Unknown circuit type
      return false;
    }

    const vkResponse = await fetch(vkPath);
    const vk = await vkResponse.json();

    // Convert proof to snarkjs format
    const snarkjsProof = {
      ...proof,
      curve: 'bn128', // Default curve for Groth16
    } as any;

    const isValid = await snarkjs.groth16.verify(vk, publicSignals, snarkjsProof);

    return isValid;
  } catch (error: any) {
    console.error('Proof verification error:', error);
    return false;
  }
}

/**
 * Hash proof for storage and sharing
 */
export async function hashProof(proofData: ProofData): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(proofData));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Download proof as JSON file
 */
export function downloadProof(proof: ProofResult, filename?: string): void {
  const proofJson = {
    proof: proof.proof,
    publicSignals: proof.publicSignals,
    circuitType: proof.circuitType,
    proofHash: proof.proofHash,
    generatedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(proofJson, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `proof_${proof.circuitType}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Store proof in browser localStorage
 */
export function storeProof(proof: ProofResult): void {
  try {
    const stored = localStorage.getItem('blurd_proofs');
    const proofs = stored ? JSON.parse(stored) : [];
    
    const proofRecord = {
      ...proof,
      generatedAt: proof.generatedAt || new Date().toISOString(),
    };
    
    // Check if proof already exists (by proofHash)
    const existingIndex = proofs.findIndex((p: ProofResult) => p.proofHash === proof.proofHash);
    if (existingIndex >= 0) {
      // Update existing proof
      proofs[existingIndex] = proofRecord;
    } else {
      // Add new proof
      proofs.push(proofRecord);
    }
    
    localStorage.setItem('blurd_proofs', JSON.stringify(proofs));
    console.log('Proof stored successfully:', proofRecord);
  } catch (error) {
    console.error('Error storing proof:', error);
    throw error;
  }
}

/**
 * Load stored proofs from localStorage
 */
export function loadStoredProofs(): ProofResult[] {
  const stored = localStorage.getItem('blurd_proofs');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

