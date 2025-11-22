/**
 * Circuit file loading utilities with robust existence checks
 */

export interface CircuitFiles {
  wasm: string;
  zkey: string;
  vk?: string;
}

/**
 * Check if a file exists at the given URL
 */
async function checkFileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Load circuit files with robust existence checks
 * Throws meaningful errors if files are missing
 */
export async function loadCircuitFiles(
  type: 'age18' | 'country' | 'uniqueness' | 'credential'
): Promise<CircuitFiles> {
  const fileConfig: Record<string, CircuitFiles> = {
    age18: {
      wasm: '/zk/age18.wasm',
      zkey: '/zk/age18.zkey',
      vk: '/zk/age18_verification_key.json',
    },
    country: {
      wasm: '/zk/countryProof.wasm',
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
  };

  const files = fileConfig[type];
  if (!files) {
    throw new Error(`Unknown circuit type: ${type}`);
  }

  // Check if files exist
  const wasmExists = await checkFileExists(files.wasm);
  const zkeyExists = await checkFileExists(files.zkey);

  if (!wasmExists || !zkeyExists) {
    const missingFiles: string[] = [];
    if (!wasmExists) missingFiles.push(files.wasm);
    if (!zkeyExists) missingFiles.push(files.zkey);

    const circuitName = type === 'age18' ? 'age' : type === 'country' ? 'country/nationality' : type;
    
    throw new Error(
      `${circuitName.charAt(0).toUpperCase() + circuitName.slice(1)} proof circuit files are missing!\n\n` +
      `Missing files:\n${missingFiles.map(f => `  - ${f}`).join('\n')}\n\n` +
      `To fix this, run from the project root:\n\n` +
      `npm run setup:${type === 'age18' ? 'age' : type}-proof\n\n` +
      `This will:\n` +
      `1. Compile the ${circuitName} proof circuit\n` +
      `2. Generate test proving keys\n` +
      `3. Copy files to public/zk/\n\n` +
      `Or build all circuits at once:\n` +
      `npm run zk:build\n\n` +
      `For development, the setup scripts will create test keys automatically.\n` +
      `Make sure you have circom and snarkjs installed:\n` +
      `  npm install -g circom snarkjs`
    );
  }

  // Optionally check verification key
  if (files.vk) {
    const vkExists = await checkFileExists(files.vk);
    if (!vkExists) {
      console.warn(`Warning: Verification key not found: ${files.vk}`);
    }
  }

  return files;
}

