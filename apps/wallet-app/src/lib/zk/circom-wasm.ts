'use client';

/**
 * Circom/SnarkJS Integration for Age Proof
 * 
 * Uses Circom circuits with SnarkJS for real zero-knowledge proof generation
 * Circuit: age18.circom - proves age >= min_age without revealing actual age
 */

let snarkjs: any = null;
let isInitialized = false;

/**
 * Initialize SnarkJS library
 * The WASM and zkey files are loaded on-demand by SnarkJS
 */
export async function initCircomWasm(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Load SnarkJS library
    snarkjs = await import('snarkjs');
    isInitialized = true;
    console.log('✅ SnarkJS initialized successfully');
  } catch (error) {
    console.error('SnarkJS not available:', error);
    throw new Error('SnarkJS library not found. Please install: npm install snarkjs');
  }
}


/**
 * Generate an age proof using Circom/SnarkJS
 * 
 * @param age - User's actual age (private input)
 * @param minAge - Minimum required age (public input, typically 18)
 * @returns Proof data including proof.json and public inputs
 */
export async function generateAgeProof(
  age: number,
  minAge: number = 18
): Promise<{
  proof: any;
  publicInputs: string[];
  proofHash: string;
}> {
  if (!isInitialized) {
    await initCircomWasm();
  }

  if (age < 0 || age > 255) {
    throw new Error('Age must be between 0 and 255');
  }

  if (age < minAge) {
    throw new Error(`Age ${age} is less than minimum age ${minAge}`);
  }

  try {
    if (!snarkjs) {
      throw new Error('SnarkJS library not loaded');
    }

    // Prepare inputs for the circuit
    // The circuit expects: { age, min_age }
    const inputs = {
      age: age,
      min_age: minAge
    };

    // Use SnarkJS fullProve which handles witness generation and proof generation
    console.log('📝 Generating witness and proof...');
    const wasmPath = '/zk/age18.wasm';
    const zkeyPath = '/zk/age18.zkey';
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      wasmPath,
      zkeyPath
    );

    // Convert proof to JSON format
    const proofJson = {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: 'groth16'
    };

    // Convert public signals to strings
    const publicInputs = publicSignals.map((s: any) => s.toString());

    // Generate proof hash for identification
    const proofData = JSON.stringify(proofJson);
    const proofHash = await hashProof(proofData);

    console.log('✅ Proof generated successfully');
    return {
      proof: proofJson,
      publicInputs,
      proofHash,
    };
  } catch (error: any) {
    console.error('Proof generation error:', error);
    throw new Error(`Failed to generate proof: ${error.message}`);
  }
}

/**
 * Hash proof data to create a unique identifier
 */
async function hashProof(proofData: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(proofData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Download proof files as JSON
 */
export function downloadProofFiles(
  proofData: { proof: any; publicInputs: string[] },
  filename: string = 'age-proof'
): void {
  // Download proof.json
  const proofBlob = new Blob([JSON.stringify(proofData.proof, null, 2)], {
    type: 'application/json',
  });
  const proofUrl = URL.createObjectURL(proofBlob);
  const proofLink = document.createElement('a');
  proofLink.href = proofUrl;
  proofLink.download = `${filename}-proof.json`;
  proofLink.click();
  URL.revokeObjectURL(proofUrl);

  // Download public.json
  const publicBlob = new Blob([JSON.stringify(proofData.publicInputs, null, 2)], {
    type: 'application/json',
  });
  const publicUrl = URL.createObjectURL(publicBlob);
  const publicLink = document.createElement('a');
  publicLink.href = publicUrl;
  publicLink.download = `${filename}-public.json`;
  publicLink.click();
  URL.revokeObjectURL(publicUrl);
}


