/**
 * Hash unique identifier for uniqueness proof
 * Uses Poseidon hash for compatibility with ZK circuits
 */

/**
 * Hash a unique identifier string
 * Returns a hash suitable for use in ZK circuits
 */
export async function hashIdentifier(value: string): Promise<string> {
  if (!value || value.trim().length === 0) {
    throw new Error('Identifier value cannot be empty');
  }

  try {
    // Try to use Poseidon hash (preferred for ZK circuits)
    const { poseidon } = await import('circomlibjs');
    
    // Convert string to array of field elements
    // Poseidon works best with field elements, so we convert each character to its ASCII code
    // Then hash in chunks if needed
    const chars = value.split('');
    const asciiInts = chars.map(c => BigInt(c.charCodeAt(0)));
    
    // Poseidon has limits on input size, so we hash in chunks if needed
    // For simplicity, we'll hash up to 16 characters at a time (Poseidon's typical limit)
    if (asciiInts.length <= 16) {
      const hash = poseidon(asciiInts);
      return '0x' + hash.toString(16).padStart(64, '0');
    } else {
      // For longer strings, hash in chunks and combine
      // This is a simplified approach - in production, use a proper Merkle tree or hierarchical hashing
      const chunks: BigInt[] = [];
      for (let i = 0; i < asciiInts.length; i += 16) {
        const chunk = asciiInts.slice(i, i + 16);
        // Pad chunk to 16 elements with zeros if needed
        while (chunk.length < 16) {
          chunk.push(BigInt(0));
        }
        const chunkHash = poseidon(chunk);
        chunks.push(chunkHash);
      }
      
      // Hash the chunk hashes
      if (chunks.length === 1) {
        return '0x' + chunks[0].toString(16).padStart(64, '0');
      }
      
      // Combine chunks
      while (chunks.length < 16) {
        chunks.push(BigInt(0));
      }
      const finalHash = poseidon(chunks.slice(0, 16));
      return '0x' + finalHash.toString(16).padStart(64, '0');
    }
  } catch (error) {
    console.warn('Poseidon unavailable, falling back to SHA-256:', error);
    // Fallback to SHA-256 if Poseidon unavailable
    return await hashIdentifierSHA256(value);
  }
}

/**
 * Hash identifier using SHA-256 (fallback)
 */
async function hashIdentifierSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract primary unique identifier from ExtractedFields
 * Priority: documentNumber > voterNumber > passportNumber > serialNumber
 */
export function extractPrimaryIdentifier(fields: {
  documentNumber?: string;
  voterNumber?: string;
  passportNumber?: string;
  serialNumber?: string;
}): string | null {
  if (fields.documentNumber) {
    return fields.documentNumber;
  }
  if (fields.voterNumber) {
    return fields.voterNumber;
  }
  if (fields.passportNumber) {
    return fields.passportNumber;
  }
  if (fields.serialNumber) {
    return fields.serialNumber;
  }
  return null;
}

