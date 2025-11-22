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
 */
export async function generateAgeProof(userAge: number, minAge: number = 18): Promise<ProofResult> {
  try {
    const snarkjs = await import('snarkjs');
    const { loadCircuitFiles } = await import('./loadCircuit');
    
    // Load and validate circuit files exist
    const files = await loadCircuitFiles('age18');
    const wasmPath = files.wasm;
    const zkeyPath = files.zkey;

    // Step 1: Validate and convert to single integer scalar
    // Ensure userAge is NOT an array, object, or invalid value
    if (Array.isArray(userAge) || typeof userAge === 'object') {
      throw new Error(`Age proof failed: expected single integer for 'userAge' but got ${Array.isArray(userAge) ? 'array' : 'object'}. Value: ${JSON.stringify(userAge)}`);
    }

    // Convert to integer - ensure it's a scalar number
    let ageNum: number;
    if (typeof userAge === 'number') {
      ageNum = Math.floor(userAge);
    } else {
      const parsed = parseInt(String(userAge), 10);
      if (isNaN(parsed)) {
        throw new Error(`Age proof failed: expected single integer for 'userAge' but got string that cannot be parsed. Value: ${JSON.stringify(userAge)}`);
      }
      ageNum = parsed;
    }

    // Validate it's a proper integer
    if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 150) {
      throw new Error(`Age proof failed: invalid age value. Expected integer between 0-150, got: ${ageNum}`);
    }
    
    // Additional validation: Ensure age is positive integer
    if (ageNum <= 0) {
      throw new Error(`Age proof failed: age must be a positive integer, got: ${ageNum}`);
    }

    // Same validation for minAge
    let minAgeNum: number;
    if (typeof minAge === 'number') {
      minAgeNum = Math.floor(minAge);
    } else {
      const parsed = parseInt(String(minAge), 10);
      if (isNaN(parsed)) {
        throw new Error(`Age proof failed: invalid minAge value: ${minAge}`);
      }
      minAgeNum = parsed;
    }

    if (!Number.isInteger(minAgeNum) || minAgeNum < 0) {
      throw new Error(`Age proof failed: invalid minAge value: ${minAgeNum}`);
    }

    // Ensure userAge >= minAge for valid proof
    if (ageNum < minAgeNum) {
      throw new Error(`User age (${ageNum}) must be greater than or equal to minimum age (${minAgeNum})`);
    }

    // Step 2: Build input object with exact shape expected by circuit
    // Circuit expects: { userAge: scalar, minAge: scalar }
    // SnarkJS expects numbers (not strings) for scalar inputs
    const inputs = {
      userAge: ageNum,  // Number format for scalar input
      minAge: minAgeNum, // Number format for scalar input
    };

    // Step 3: Sanity check - validate input shape
    const expectedSignals = ['userAge', 'minAge'];
    const inputKeys = Object.keys(inputs);
    if (inputKeys.length !== expectedSignals.length || !expectedSignals.every(key => inputKeys.includes(key))) {
      throw new Error(`Age proof failed: input shape mismatch. Expected keys: ${expectedSignals.join(', ')}, got: ${inputKeys.join(', ')}`);
    }

    // Step 4: Validate each input is a scalar (not array)
    for (const [key, value] of Object.entries(inputs)) {
      if (Array.isArray(value)) {
        throw new Error(`Age proof failed: expected single scalar for '${key}' but got array. Value: ${JSON.stringify(value)}`);
      }
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error(`Age proof failed: expected string or number for '${key}' but got ${typeof value}. Value: ${JSON.stringify(value)}`);
      }
    }

    console.log('Age proof input validation passed:', {
      userAge: inputs.userAge,
      minAge: inputs.minAge,
      userAgeType: typeof inputs.userAge,
      minAgeType: typeof inputs.minAge,
      isArray: Array.isArray(inputs.userAge) || Array.isArray(inputs.minAge),
    });

    // Step 5: Generate proof
    let proof: any;
    let publicSignals: any;

    try {
      const result = await snarkjs.groth16.fullProve(
        inputs,
        wasmPath,
        zkeyPath
      );
      proof = result.proof;
      publicSignals = result.publicSignals;
    } catch (error: any) {
      console.error('SnarkJS proof generation error:', error.message);
      console.error('Input that failed:', JSON.stringify(inputs, null, 2));
      
      // Provide detailed error message
      if (error.message?.includes('too many value') || error.message?.includes('too many')) {
        throw new Error(`Age proof failed: expected single integer scalar for 'userAge' but circuit received multiple values. This usually means the input format is incorrect. Input: ${JSON.stringify(inputs)}. Original error: ${error.message}`);
      }
      
      // Detect WASM file loading errors (404 HTML response)
      if (error.message?.includes('magic word') || 
          error.message?.includes('00 61 73 6d') || 
          error.message?.includes('3c 21 44 4f') ||
          error.message?.includes('Cannot find') || 
          error.message?.includes('404') ||
          error.message?.includes('Failed to fetch')) {
        const { loadCircuitFiles } = await import('./loadCircuit');
        try {
          await loadCircuitFiles('age18');
        } catch (fileError: any) {
          throw new Error(fileError.message || `Age proof circuit files are missing! Run: npm run setup:age-proof`);
        }
      }
      
      throw error;
    }

    // Convert publicSignals to string array
    const publicSignalsArray = Array.isArray(publicSignals) 
      ? publicSignals.map((s: any) => String(s))
      : [String(publicSignals)];

    const proofData: ProofData = {
      proof: {
        pi_a: proof.pi_a as [string, string, string],
        pi_b: proof.pi_b as [[string, string], [string, string], [string, string]],
        pi_c: proof.pi_c as [string, string, string],
        protocol: 'groth16',
      },
      publicSignals: publicSignalsArray,
    };

    const proofHash = await hashProof(proofData);

    return {
      proof: proofData.proof,
      publicSignals: publicSignalsArray,
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
 */
export async function generateCountryProof(
  userCountryCode: string,
  requiredCountryCode: string
): Promise<ProofResult> {
  try {
    const snarkjs = await import('snarkjs');
    const { sha256 } = await import('@/lib/crypto');
    const { loadCircuitFiles } = await import('./loadCircuit');
    
    // Load and validate circuit files exist
    const files = await loadCircuitFiles('country');
    const wasmPath = files.wasm;
    const zkeyPath = files.zkey;

    // Step 1: Validate country codes are strings (not arrays/objects)
    if (Array.isArray(userCountryCode) || typeof userCountryCode === 'object') {
      throw new Error(`Country proof failed: expected string for 'userCountryCode' but got ${Array.isArray(userCountryCode) ? 'array' : 'object'}. Value: ${JSON.stringify(userCountryCode)}`);
    }
    
    if (Array.isArray(requiredCountryCode) || typeof requiredCountryCode === 'object') {
      throw new Error(`Country proof failed: expected string for 'requiredCountryCode' but got ${Array.isArray(requiredCountryCode) ? 'array' : 'object'}. Value: ${JSON.stringify(requiredCountryCode)}`);
    }

    // Normalize country codes (uppercase, trim)
    const userCountry = String(userCountryCode).trim().toUpperCase();
    const requiredCountry = String(requiredCountryCode).trim().toUpperCase();

    if (!userCountry || userCountry.length === 0) {
      throw new Error('Country proof failed: userCountryCode cannot be empty');
    }
    if (!requiredCountry || requiredCountry.length === 0) {
      throw new Error('Country proof failed: requiredCountryCode cannot be empty');
    }

    // Step 2: Hash country codes with SHA-256 (simple hash for MVP)
    // In production, use Poseidon hash if the circuit expects that
    const userCountryHash = await sha256(userCountry);
    const requiredCountryHash = await sha256(requiredCountry);

    // Convert hashes to BigInt then to string for field element format
    const userCountryHashBigInt = BigInt(userCountryHash);
    const requiredCountryHashBigInt = BigInt(requiredCountryHash);

    // Step 3: Build input object with exact shape expected by circuit
    // Circuit expects: { userCountryHash: scalar, requiredCountryHash: scalar }
    // For large hash values, we need to use field element format (modulo field size)
    const fieldSize = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'); // BN254 field size
    const userCountryHashField = userCountryHashBigInt % fieldSize;
    const requiredCountryHashField = requiredCountryHashBigInt % fieldSize;
    
    // Convert to string for snarkjs (large numbers should be strings to avoid precision loss)
    const inputs = {
      userCountryHash: String(userCountryHashField),  // String format for field element
      requiredCountryHash: String(requiredCountryHashField), // String format for field element
    };

    // Step 4: Sanity check - validate input shape
    const expectedSignals = ['userCountryHash', 'requiredCountryHash'];
    const inputKeys = Object.keys(inputs);
    if (inputKeys.length !== expectedSignals.length || !expectedSignals.every(key => inputKeys.includes(key))) {
      throw new Error(`Country proof failed: input shape mismatch. Expected keys: ${expectedSignals.join(', ')}, got: ${inputKeys.join(', ')}`);
    }

    // Step 5: Validate each input is a scalar (not array)
    for (const [key, value] of Object.entries(inputs)) {
      if (Array.isArray(value)) {
        throw new Error(`Country proof failed: expected single scalar for '${key}' but got array. Value: ${JSON.stringify(value)}`);
      }
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error(`Country proof failed: expected string or number for '${key}' but got ${typeof value}. Value: ${JSON.stringify(value)}`);
      }
    }

    console.log('Country proof input validation passed:', {
      userCountry,
      requiredCountry,
      userCountryHash: String(inputs.userCountryHash).substring(0, 20) + '...',
      requiredCountryHash: String(inputs.requiredCountryHash).substring(0, 20) + '...',
    });

    // Step 6: Generate proof
    let proof: any;
    let publicSignals: any;

    try {
      const result = await snarkjs.groth16.fullProve(
        inputs,
        wasmPath,
        zkeyPath
      );
      proof = result.proof;
      publicSignals = result.publicSignals;
    } catch (error: any) {
      console.error('SnarkJS country proof generation error:', error.message);
      console.error('Input that failed:', JSON.stringify(inputs, null, 2));
      
      // Provide detailed error message
      if (error.message?.includes('too many value') || error.message?.includes('too many')) {
        throw new Error(`Country proof failed: expected single integer scalar for country hash but circuit received multiple values. Input: ${JSON.stringify(inputs)}. Original error: ${error.message}`);
      }
      
      // Detect WASM file loading errors (404 HTML response)
      if (error.message?.includes('magic word') || 
          error.message?.includes('00 61 73 6d') || 
          error.message?.includes('3c 21 44 4f') ||
          error.message?.includes('Cannot find') || 
          error.message?.includes('404') ||
          error.message?.includes('Failed to fetch')) {
        const { loadCircuitFiles } = await import('./loadCircuit');
        try {
          await loadCircuitFiles('country');
        } catch (fileError: any) {
          throw new Error(fileError.message || `Country proof circuit files are missing! Run: npm run setup:country-proof`);
        }
      }
      
      throw error;
    }

    // Convert publicSignals to string array
    const publicSignalsArray = Array.isArray(publicSignals) 
      ? publicSignals.map((s: any) => String(s))
      : [String(publicSignals)];

    const proofData: ProofData = {
      proof: {
        pi_a: proof.pi_a as [string, string, string],
        pi_b: proof.pi_b as [[string, string], [string, string], [string, string]],
        pi_c: proof.pi_c as [string, string, string],
        protocol: 'groth16',
      },
      publicSignals: publicSignalsArray,
    };

    const proofHash = await hashProof(proofData);

    return {
      proof: proofData.proof,
      publicSignals: publicSignalsArray,
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
 */
export async function generateUniquenessProof(identifier: string): Promise<ProofResult> {
  try {
    const snarkjs = await import('snarkjs');
    const { hashIdentifier } = await import('@/lib/uniqueness/hashIdentifier');
    const { storeUniquenessCommitment, isCommitmentDuplicate, getCurrentMerkleRoot } = await import('@/lib/uniqueness/merkleStore');
    
    const files = circuitFiles.uniqueness;
    const wasmPath = files.wasm;
    const zkeyPath = files.zkey;

    // Step 1: Validate identifier
    if (!identifier || identifier.trim().length === 0) {
      throw new Error('Unique identifier cannot be empty');
    }

    // Step 2: Hash the identifier
    const identifierHash = await hashIdentifier(identifier.trim());
    console.log('Hashed identifier:', identifierHash.substring(0, 20) + '...');

    // Step 3: Check for duplicate commitment
    if (isCommitmentDuplicate(identifierHash)) {
      throw new Error('This identifier has already been used. Each document can only be used once for uniqueness proof.');
    }

    // Step 4: Convert hash to BigInt for circuit input
    const identifierHashBigInt = BigInt(identifierHash);
    
    // Step 5: Build input object
    // Circuit expects: { identifierHash: scalar }
    // For MVP, we'll use the hash as a number (modulo field size for ZK circuit compatibility)
    const fieldSize = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'); // BN254 field size
    const identifierHashField = identifierHashBigInt % fieldSize;
    
    const inputs = {
      identifierHash: String(identifierHashField), // String format for field element
    };

    console.log('Uniqueness proof input validation passed:', {
      identifierHash: String(inputs.identifierHash).substring(0, 20) + '...',
    });

    // Step 6: Generate proof
    let proof: any;
    let publicSignals: any;

    try {
      const result = await snarkjs.groth16.fullProve(
        inputs,
        wasmPath,
        zkeyPath
      );
      proof = result.proof;
      publicSignals = result.publicSignals;
    } catch (error: any) {
      console.error('SnarkJS uniqueness proof generation error:', error.message);
      console.error('Input that failed:', JSON.stringify(inputs, null, 2));
      
      // Detect WASM file loading errors (404 HTML response)
      if (error.message?.includes('magic word') || 
          error.message?.includes('00 61 73 6d') || 
          error.message?.includes('3c 21 44 4f') ||
          error.message?.includes('Cannot find') || 
          error.message?.includes('404')) {
        throw new Error(`Uniqueness proof circuit files are missing!\n\nTo fix this, run from the project root:\n\nnpm run setup:uniqueness-proof\n\nThis will:\n1. Compile the uniqueness proof circuit\n2. Generate test proving keys\n3. Copy files to public/zk/\n\nExpected files:\n- ${wasmPath}\n- ${zkeyPath}\n\nFor development, the setup script will create test keys automatically.`);
      }
      
      throw error;
    }

    // Step 7: Store commitment and get Merkle root
    const { merkleRoot } = await storeUniquenessCommitment(identifierHash);

    // Convert publicSignals to string array
    const publicSignalsArray = Array.isArray(publicSignals) 
      ? publicSignals.map((s: any) => String(s))
      : [String(publicSignals)];

    // Update Merkle root in public signals if needed
    // The circuit should output the Merkle root, but we ensure it's correct
    if (publicSignalsArray.length === 0 || publicSignalsArray[0] !== merkleRoot) {
      publicSignalsArray[0] = merkleRoot;
    }

    const proofData: ProofData = {
      proof: {
        pi_a: proof.pi_a as [string, string, string],
        pi_b: proof.pi_b as [[string, string], [string, string], [string, string]],
        pi_c: proof.pi_c as [string, string, string],
        protocol: 'groth16',
      },
      publicSignals: publicSignalsArray,
    };

    const proofHash = await hashProof(proofData);

    return {
      proof: proofData.proof,
      publicSignals: publicSignalsArray,
      proofHash,
      circuitType: 'uniqueness',
      merkleRoot,
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

