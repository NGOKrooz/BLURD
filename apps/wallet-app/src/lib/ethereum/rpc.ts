/**
 * Ethereum/Aztec L2 RPC Provider System with Fallback Support
 * Compatible with Aztec L2 testnet and Ethereum mainnet/testnets
 */

import { ethers } from 'ethers';

// Aztec L2 Sepolia Testnet Chain ID
export const AZTEC_SEPOLIA_CHAIN_ID = 0x1a515; // 107517 in decimal
export const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

// RPC fallback order for Aztec/Ethereum
const RPC_FALLBACKS = [
  process.env.NEXT_PUBLIC_ETHEREUM_RPC,
  process.env.NEXT_PUBLIC_AZTEC_RPC,
  'https://rpc.ankr.com/eth_sepolia',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'https://ethereum-sepolia-rpc.publicnode.com',
].filter(Boolean) as string[];

// Cache for working provider
let cachedProvider: ethers.JsonRpcProvider | null = null;
let cachedRpcUrl: string | null = null;

/**
 * Get a working RPC provider by trying all fallbacks
 * @returns A working JsonRpcProvider instance
 * @throws Error if no RPC endpoints are reachable
 */
export async function getWorkingProvider(): Promise<ethers.JsonRpcProvider> {
  // Return cached provider if available
  if (cachedProvider && cachedRpcUrl) {
    try {
      // Quick health check on cached provider
      await cachedProvider.getBlockNumber();
      return cachedProvider;
    } catch (error) {
      // Cached provider failed, clear cache and try again
      console.warn('⚠️  Cached provider failed, trying fallbacks...');
      cachedProvider = null;
      cachedRpcUrl = null;
    }
  }

  console.log('🔍 Detecting Ethereum/Aztec RPC...');

  // Try each RPC in order
  for (let i = 0; i < RPC_FALLBACKS.length; i++) {
    const rpcUrl = RPC_FALLBACKS[i];
    const rpcName = getRpcName(rpcUrl);

    try {
      console.log(`➡ Trying ${rpcName}...`);

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test the provider by getting chain ID
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Verify it's Sepolia (Ethereum Sepolia or Aztec Sepolia)
      if (chainId !== ETHEREUM_SEPOLIA_CHAIN_ID && chainId !== AZTEC_SEPOLIA_CHAIN_ID) {
        console.warn(`⚠️  ${rpcName} returned wrong chain ID: ${chainId}`);
        continue;
      }

      // Success! Cache and return
      cachedProvider = provider;
      cachedRpcUrl = rpcUrl;
      console.log(`✔ Connected to Ethereum Sepolia using ${rpcName} RPC`);
      return provider;
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      console.warn(`❌ ${rpcName} failed: ${errorMsg}`);
      
      // Continue to next RPC
      continue;
    }
  }

  // All RPCs failed
  console.error('❌ No RPCs reachable. Check internet or RPC endpoints.');
  throw new Error('RPC unreachable: All RPC endpoints failed. Please check your internet connection.');
}

/**
 * Get a human-readable name for an RPC URL
 */
function getRpcName(rpcUrl: string): string {
  if (rpcUrl.includes('ankr')) return 'Ankr';
  if (rpcUrl.includes('infura')) return 'Infura';
  if (rpcUrl.includes('publicnode')) return 'PublicNode';
  if (rpcUrl.includes('aztec')) return 'Aztec';
  if (process.env.NEXT_PUBLIC_ETHEREUM_RPC || process.env.NEXT_PUBLIC_AZTEC_RPC) {
    return 'Custom RPC';
  }
  return 'Unknown';
}

/**
 * Validate that the provider is connected to Ethereum Sepolia or Aztec Sepolia
 * @param provider The RPC provider to validate
 * @throws Error with descriptive message if validation fails
 */
export async function validateEthereumNetwork(provider: ethers.JsonRpcProvider): Promise<void> {
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId !== ETHEREUM_SEPOLIA_CHAIN_ID && chainId !== AZTEC_SEPOLIA_CHAIN_ID) {
      throw new Error(
        `Connected wallet is not on Ethereum Sepolia or Aztec Sepolia. Expected: ${ETHEREUM_SEPOLIA_CHAIN_ID} or ${AZTEC_SEPOLIA_CHAIN_ID}, Got: ${chainId}`
      );
    }
  } catch (error: any) {
    if (error.message?.includes('not on Ethereum Sepolia')) {
      throw error;
    }
    
    // RPC unreachable error
    const rpcUrl = (provider as any).connection?.url || 'Unknown RPC';
    throw new Error(`RPC unreachable: ${rpcUrl}. ${error.message || 'Network request failed'}`);
  }
}

/**
 * Clear the cached provider (useful for testing or forcing refresh)
 */
export function clearProviderCache(): void {
  cachedProvider = null;
  cachedRpcUrl = null;
}

/**
 * Get the currently cached RPC URL (for debugging)
 */
export function getCachedRpcUrl(): string | null {
  return cachedRpcUrl;
}

