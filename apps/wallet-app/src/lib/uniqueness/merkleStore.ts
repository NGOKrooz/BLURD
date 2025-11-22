/**
 * Merkle tree store for uniqueness commitments
 * Simplified in-memory store for MVP (can be replaced with backend API)
 */

export interface MerkleStore {
  leaves: string[];
  root: string;
}

/**
 * Simple Merkle tree implementation for uniqueness commitments
 * Note: This is a simplified version for MVP. Production should use a proper Merkle tree library.
 */

/**
 * Compute Merkle root from leaves
 * Simplified version that just hashes all leaves together
 */
export async function computeMerkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) {
    // Return zero hash for empty tree
    const encoder = new TextEncoder();
    const data = encoder.encode('empty');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (leaves.length === 1) {
    return leaves[0];
  }

  // Simple approach: hash all leaves in pairs
  // In production, use a proper Merkle tree implementation
  try {
    const { poseidon2 } = await import('poseidon-lite');
    
    // Pair up leaves and hash them
    let currentLevel = leaves.map(leaf => BigInt(leaf));
    
    while (currentLevel.length > 1) {
      const nextLevel: BigInt[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          // Hash pair
          const pairHash = poseidon2([currentLevel[i], currentLevel[i + 1]]);
          nextLevel.push(pairHash);
        } else {
          // Odd leaf, hash with itself
          const selfHash = poseidon2([currentLevel[i], currentLevel[i]]);
          nextLevel.push(selfHash);
        }
      }
      currentLevel = nextLevel;
    }
    
    return '0x' + currentLevel[0].toString(16).padStart(64, '0');
  } catch (error) {
    console.warn('Poseidon unavailable for Merkle root, using SHA-256:', error);
    // Fallback to SHA-256
    return await computeMerkleRootSHA256(leaves);
  }
}

/**
 * Compute Merkle root using SHA-256 (fallback)
 */
async function computeMerkleRootSHA256(leaves: string[]): Promise<string> {
  if (leaves.length === 1) {
    return leaves[0];
  }

  // Simple pairing approach with SHA-256
  let currentLevel = leaves;
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
      
      const encoder = new TextEncoder();
      const data = encoder.encode(left + right);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      nextLevel.push(hash);
    }
    currentLevel = nextLevel;
  }
  
  return currentLevel[0];
}

/**
 * Store uniqueness commitment in localStorage
 * For MVP, we use localStorage. In production, this should call a backend API.
 */
export async function storeUniquenessCommitment(
  commitmentHash: string
): Promise<{ success: boolean; merkleRoot: string }> {
  try {
    const stored = localStorage.getItem('blurd_uniqueness_commitments');
    const commitments: string[] = stored ? JSON.parse(stored) : [];
    
    // Check for duplicate (should not happen, but safety check)
    if (commitments.includes(commitmentHash)) {
      throw new Error('Commitment already exists - duplicate identifier detected!');
    }
    
    // Add new commitment
    commitments.push(commitmentHash);
    
    // Compute new Merkle root
    const merkleRoot = await computeMerkleRoot(commitments);
    
    // Store updated commitments
    localStorage.setItem('blurd_uniqueness_commitments', JSON.stringify(commitments));
    localStorage.setItem('blurd_uniqueness_merkle_root', merkleRoot);
    
    return {
      success: true,
      merkleRoot,
    };
  } catch (error) {
    console.error('Error storing uniqueness commitment:', error);
    throw error;
  }
}

/**
 * Load stored uniqueness commitments from localStorage
 */
export function loadUniquenessCommitments(): string[] {
  const stored = localStorage.getItem('blurd_uniqueness_commitments');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get current Merkle root from localStorage
 */
export async function getCurrentMerkleRoot(): Promise<string> {
  const stored = localStorage.getItem('blurd_uniqueness_merkle_root');
  if (stored) {
    return stored;
  }
  
  // Compute from stored commitments
  const commitments = loadUniquenessCommitments();
  return await computeMerkleRoot(commitments);
}

/**
 * Check if commitment exists (duplicate check)
 */
export function isCommitmentDuplicate(commitmentHash: string): boolean {
  const commitments = loadUniquenessCommitments();
  return commitments.includes(commitmentHash);
}

