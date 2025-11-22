'use client';

/**
 * Hash unique identifier for uniqueness proof
 * Uses Poseidon hash for compatibility with ZK circuits
 */

/**
 * Hash a unique identifier string
 * Returns a hash suitable for use in ZK circuits
 * 
 * @param value - The unique identifier string to hash
 * @returns A hex string prefixed with '0x'
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
    // Use lowercase bigint for compatibility
    const chars = value.split('');
    const asciiInts: bigint[] = chars.map(c => BigInt(c.charCodeAt(0)));
    
    // Poseidon has limits on input size, so we hash in chunks if needed
    // For simplicity, we'll hash up to 16 characters at a time (Poseidon's typical limit)
    if (asciiInts.length <= 16) {
      // Type assertion: bigint[] is assignable to (bigint | number | string)[]
      const input: (bigint | number | string)[] = asciiInts;
      const hash = poseidon(input);
      return '0x' + hash.toString(16).padStart(64, '0');
    } else {
      // For longer strings, hash in chunks and combine
      // This is a simplified approach - in production, use a proper Merkle tree or hierarchical hashing
      const chunks: bigint[] = [];
      
      for (let i = 0; i < asciiInts.length; i += 16) {
        const chunk = asciiInts.slice(i, i + 16);
        // Pad chunk to 16 elements with zeros if needed
        const paddedChunk: bigint[] = [...chunk];
        while (paddedChunk.length < 16) {
          paddedChunk.push(BigInt(0));
        }
        // Type assertion: bigint[] is assignable to (bigint | number | string)[]
        const input: (bigint | number | string)[] = paddedChunk;
        const chunkHash = poseidon(input);
        chunks.push(chunkHash);
      }
      
      // Hash the chunk hashes
      if (chunks.length === 1) {
        return '0x' + chunks[0].toString(16).padStart(64, '0');
      }
      
      // Combine chunks - pad to 16 elements
      const paddedChunks: bigint[] = [...chunks];
      while (paddedChunks.length < 16) {
        paddedChunks.push(BigInt(0));
      }
      
      // Take first 16 chunks and ensure proper typing
      const finalChunks = paddedChunks.slice(0, 16);
      // Explicitly map to ensure proper type inference
      // Type assertion: bigint[] is assignable to (bigint | number | string)[]
      const input: (bigint | number | string)[] = finalChunks.map(n => n as bigint);
      const finalHash = poseidon(input);
      return '0x' + finalHash.toString(16).padStart(64, '0');
    }
  } catch (error) {
    // Log the error for debugging but don't swallow it
    console.warn('Poseidon unavailable, falling back to SHA-256:', error);
    // Fallback to SHA-256 if Poseidon unavailable
    return await hashIdentifierSHA256(value);
  }
}

/**
 * Hash identifier using SHA-256 (fallback)
 * 
 * @param value - The identifier string to hash
 * @returns A hex string prefixed with '0x'
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
 * Priority: id_number > documentNumber > voterNumber > passportNumber > serialNumber
 * 
 * @param fields - The extracted fields object
 * @returns The primary identifier string or null if none found
 */
export function extractPrimaryIdentifier(fields: {
  id_number?: string;
  documentNumber?: string;
  voterNumber?: string;
  passportNumber?: string;
  serialNumber?: string;
}): string | null {
  // New field name (priority)
  if (fields.id_number && fields.id_number.trim().length > 0) {
    return fields.id_number;
  }
  // Legacy field names (backward compatibility)
  if (fields.documentNumber && fields.documentNumber.trim().length > 0) {
    return fields.documentNumber;
  }
  if (fields.voterNumber && fields.voterNumber.trim().length > 0) {
    return fields.voterNumber;
  }
  if (fields.passportNumber && fields.passportNumber.trim().length > 0) {
    return fields.passportNumber;
  }
  if (fields.serialNumber && fields.serialNumber.trim().length > 0) {
    return fields.serialNumber;
  }
  return null;
}
