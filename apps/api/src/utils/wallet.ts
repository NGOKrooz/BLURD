/**
 * Wallet utilities for server-side signature verification
 */

const ethers = require('ethers');

/**
 * Verify a message signature
 * Returns the recovered address if valid
 */
export async function verifySignature(
  message: string,
  signature: string
): Promise<string | null> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress;
  } catch {
    return null;
  }
}

