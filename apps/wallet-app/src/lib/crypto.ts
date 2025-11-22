/**
 * Cryptographic utilities for credential binding
 * Uses Poseidon hash (preferred) or SHA-256 (fallback)
 */

/**
 * Compute Poseidon hash for credential commitment
 * Falls back to SHA-256 if Poseidon unavailable
 */
export async function computeIdCommit(fields: {
  dob: string;
  docType: string;
  expiry: string;
  nonce: string;
}): Promise<string> {
  try {
    // Try Poseidon hash first (preferred)
    const { poseidon4 } = await import('poseidon-lite');
    
    // Convert string fields to BigInt for Poseidon
    const dobHash = BigInt('0x' + await sha256(fields.dob));
    const docTypeHash = BigInt('0x' + await sha256(fields.docType));
    const expiryHash = BigInt('0x' + await sha256(fields.expiry));
    const nonceHash = BigInt('0x' + fields.nonce);
    
    // Poseidon hash of [dobHash, docTypeHash, expiryHash, nonceHash]
    const poseidonHash = poseidon4([dobHash, docTypeHash, expiryHash, nonceHash]);
    
    // Return as hex string
    return '0x' + poseidonHash.toString(16).padStart(64, '0');
  } catch (error) {
    console.warn('Poseidon unavailable, falling back to SHA-256:', error);
    // Fallback to SHA-256
    return await computeIdCommitSHA256(fields);
  }
}

/**
 * Compute id_commit using SHA-256 (fallback)
 */
async function computeIdCommitSHA256(fields: {
  dob: string;
  docType: string;
  expiry: string;
  nonce: string;
}): Promise<string> {
  const combined = JSON.stringify({
    dob: fields.dob,
    docType: fields.docType,
    expiry: fields.expiry,
    nonce: fields.nonce
  });
  
  return await sha256(combined);
}

/**
 * Compute unique_key = Poseidon(id_commit, wallet_address)
 * Falls back to SHA-256 if Poseidon unavailable
 */
export async function computeUniqueKey(
  idCommit: string,
  walletAddress: string
): Promise<string> {
  try {
    // Try Poseidon hash first
    const { poseidon2 } = await import('poseidon-lite');
    
    const idCommitBigInt = BigInt(idCommit);
    const walletHash = BigInt('0x' + await sha256(walletAddress.toLowerCase()));
    
    const uniqueKey = poseidon2([idCommitBigInt, walletHash]);
    
    return '0x' + uniqueKey.toString(16).padStart(64, '0');
  } catch (error) {
    console.warn('Poseidon unavailable, falling back to SHA-256:', error);
    // Fallback to SHA-256
    const combined = `${idCommit}:${walletAddress.toLowerCase()}`;
    return await sha256(combined);
  }
}

/**
 * Compute SHA-256 hash
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random nonce for credential salt
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute unique_key_hash = SHA256(unique_key)
 * This is what the server stores
 */
export async function computeUniqueKeyHash(uniqueKey: string): Promise<string> {
  return await sha256(uniqueKey);
}

