'use client';

/**
 * Noir WASM Integration for Age Proof
 * 
 * This module handles loading and using the Noir WASM prover
 * to generate real zero-knowledge proofs in the browser.
 */

interface NoirWasmModule {
  init(): Promise<void>;
  prove(age: number, minAge: number): Promise<{
    proof: string;
    publicInputs: string[];
  }>;
}

let wasmModule: NoirWasmModule | null = null;
let isInitialized = false;

/**
 * Initialize the Noir WASM module
 */
export async function initNoirWasm(): Promise<void> {
  if (isInitialized && wasmModule) {
    return;
  }

  try {
    // Dynamic import of the WASM module
    // In production, this would load the actual compiled Noir WASM
    const wasmPath = '/zk/prover.wasm';
    
    // For now, we'll use a polyfill that simulates the WASM interface
    // In production, replace this with actual WASM loading
    wasmModule = await loadNoirWasm(wasmPath);
    await wasmModule.init();
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Noir WASM:', error);
    throw new Error('Failed to load Noir WASM prover. Please ensure prover.wasm is in /public/zk/');
  }
}

/**
 * Load Noir WASM module
 * 
 * Noir WASM modules typically export functions like:
 * - init() - Initialize the WASM module
 * - prove(inputs) - Generate a proof
 * - verify(proof, publicInputs) - Verify a proof
 * 
 * The exact API depends on how Noir compiles the circuit.
 * Update this function once you have the compiled WASM.
 */
async function loadNoirWasm(path: string): Promise<NoirWasmModule> {
  try {
    // Try to load the actual WASM file
    const wasmModule = await import(path);
    
    // Check if it's a valid Noir WASM module
    if (wasmModule && typeof wasmModule.init === 'function') {
      return {
        async init() {
          await wasmModule.init();
        },
        async prove(age: number, minAge: number) {
          // Noir WASM typically expects inputs as an object or array
          // Format: { age: age, min_age: minAge } or [age, minAge]
          // Adjust based on your compiled circuit's input format
          const inputs = {
            age: age.toString(),
            min_age: minAge.toString(),
          };
          
          // Call the WASM prove function
          // The exact function name and signature may vary
          const result = await wasmModule.prove(inputs);
          
          // Noir typically returns { proof: {...}, publicInputs: [...] }
          return {
            proof: JSON.stringify(result.proof || result),
            publicInputs: result.publicInputs || [minAge.toString()],
          };
        }
      };
    }
    
    throw new Error('Invalid WASM module structure');
  } catch (error: any) {
    // If WASM file doesn't exist or can't be loaded, provide helpful error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Cannot find module')) {
      throw new Error(
        'Noir WASM not found. Please:\n' +
        '1. Install Noir: irm https://raw.githubusercontent.com/noir-lang/noirup/main/install.ps1 | iex\n' +
        '2. Compile circuit: cd noir/blurd_age_proof && nargo compile --target wasm\n' +
        '3. Copy files: Run .\\scripts\\compile-noir.ps1\n' +
        '4. Ensure prover.wasm is in /public/zk/'
      );
    }
    throw error;
  }
}

/**
 * Generate an age proof using Noir WASM
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
  if (!isInitialized || !wasmModule) {
    await initNoirWasm();
  }

  if (age < 0 || age > 255) {
    throw new Error('Age must be between 0 and 255');
  }

  if (age < minAge) {
    throw new Error(`Age ${age} is less than minimum age ${minAge}`);
  }

  try {
    const result = await wasmModule!.prove(age, minAge);
    
    // Parse the proof JSON
    const proof = JSON.parse(result.proof);
    const publicInputs = result.publicInputs;

    // Generate proof hash for identification
    const proofData = JSON.stringify(proof);
    const proofHash = await hashProof(proofData);

    return {
      proof,
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


