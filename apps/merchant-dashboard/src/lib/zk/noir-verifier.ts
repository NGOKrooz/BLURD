/**
 * Noir WASM Verifier Integration
 * 
 * This module handles loading and using the Noir WASM verifier
 * to verify zero-knowledge proofs in the browser.
 */

interface NoirVerifierModule {
  init(): Promise<void>;
  verify(proof: any, publicInputs: string[], verifierKey: any): Promise<boolean>;
}

let verifierModule: NoirVerifierModule | null = null;
let isInitialized = false;

/**
 * Initialize the Noir WASM verifier module
 */
export async function initNoirVerifier(): Promise<void> {
  if (isInitialized && verifierModule) {
    return;
  }

  try {
    // Load verifier key
    const verifierKeyResponse = await fetch('/zk/verifier.json');
    if (!verifierKeyResponse.ok) {
      throw new Error('Failed to load verifier.json. Please ensure it exists in /public/zk/');
    }
    const verifierKey = await verifierKeyResponse.json();

    // Load WASM verifier
    const wasmPath = '/zk/verifier.wasm';
    verifierModule = await loadNoirVerifierWasm(wasmPath, verifierKey);
    await verifierModule.init();
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Noir verifier:', error);
    throw new Error('Failed to load Noir WASM verifier. Please ensure verifier.wasm and verifier.json are in /public/zk/');
  }
}

/**
 * Load Noir WASM verifier module
 * 
 * Noir WASM verifier typically exports:
 * - init() - Initialize the WASM module
 * - verify(proof, publicInputs, verifierKey) - Verify a proof
 * 
 * Update this function once you have the compiled WASM.
 */
async function loadNoirVerifierWasm(
  path: string,
  verifierKey: any
): Promise<NoirVerifierModule> {
  try {
    // Try to load the actual WASM file
    const wasmModule = await import(path);
    
    // Check if it's a valid Noir WASM module
    if (wasmModule && typeof wasmModule.init === 'function') {
      return {
        async init() {
          await wasmModule.init();
        },
        async verify(proof: any, publicInputs: string[], verifierKey: any) {
          // Noir WASM verifier typically expects:
          // - proof: The proof object
          // - publicInputs: Array of public inputs
          // - verifierKey: The verification key
          
          // Call the WASM verify function
          // The exact function name and signature may vary
          const isValid = await wasmModule.verify(proof, publicInputs, verifierKey);
          
          return isValid === true || isValid === 1;
        }
      };
    }
    
    throw new Error('Invalid WASM module structure');
  } catch (error: any) {
    // If WASM file doesn't exist or can't be loaded, provide helpful error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Cannot find module')) {
      throw new Error(
        'Noir WASM verifier not found. Please:\n' +
        '1. Install Noir: irm https://raw.githubusercontent.com/noir-lang/noirup/main/install.ps1 | iex\n' +
        '2. Compile circuit: cd noir/blurd_age_proof && nargo compile --target wasm\n' +
        '3. Copy files: Run .\\scripts\\compile-noir.ps1\n' +
        '4. Ensure verifier.wasm is in /public/zk/'
      );
    }
    throw error;
  }
}

/**
 * Verify a zero-knowledge proof
 * 
 * @param proof - The proof JSON object
 * @param publicInputs - Array of public inputs (should contain min_age)
 * @returns true if proof is valid, false otherwise
 */
export async function verifyProof(
  proof: any,
  publicInputs: string[]
): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!isInitialized || !verifierModule) {
    await initNoirVerifier();
  }

  try {
    // Load verifier key
    const verifierKeyResponse = await fetch('/zk/verifier.json');
    if (!verifierKeyResponse.ok) {
      return {
        valid: false,
        error: 'Verifier key not found',
      };
    }
    const verifierKey = await verifierKeyResponse.json();

    // Verify the proof
    const isValid = await verifierModule!.verify(proof, publicInputs, verifierKey);

    return {
      valid: isValid,
    };
  } catch (error: any) {
    console.error('Proof verification error:', error);
    return {
      valid: false,
      error: error.message || 'Verification failed',
    };
  }
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

  // Basic structure validation
  // Actual structure depends on Noir's proof format
  if (typeof proof !== 'object') {
    return { valid: false, error: 'Proof must be a JSON object' };
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


