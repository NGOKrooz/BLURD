/**
 * Robust RPC Provider System with Fallback Support
 * Automatically tries multiple RPC endpoints until one works
 */

import { RpcProvider } from 'starknet';

// Expected chain ID for Starknet Sepolia
export const SN_SEPOLIA_CHAIN_ID = '0x534e5f5345504f4c4941';

// RPC fallback order
const RPC_FALLBACKS = [
  process.env.NEXT_PUBLIC_STARKNET_RPC,
  'https://rpc.nethermind.io/starknet/sepolia',
  'https://starknet-sepolia.lava.build',
  'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
].filter(Boolean) as string[];

// Cache for working provider
let cachedProvider: RpcProvider | null = null;
let cachedRpcUrl: string | null = null;

/**
 * Get a working RPC provider by trying all fallbacks
 * @returns A working RpcProvider instance
 * @throws Error if no RPC endpoints are reachable
 */
export async function getWorkingProvider(): Promise<RpcProvider> {
  // Return cached provider if available
  if (cachedProvider && cachedRpcUrl) {
    try {
      // Quick health check on cached provider
      await cachedProvider.getChainId();
      return cachedProvider;
    } catch (error) {
      // Cached provider failed, clear cache and try again
      console.warn('⚠️  Cached provider failed, trying fallbacks...');
      cachedProvider = null;
      cachedRpcUrl = null;
    }
  }

  console.log('🔍 Detecting Starknet RPC...');

  // Try each RPC in order
  for (let i = 0; i < RPC_FALLBACKS.length; i++) {
    const rpcUrl = RPC_FALLBACKS[i];
    const rpcName = getRpcName(rpcUrl);

    try {
      console.log(`➡ Trying ${rpcName}...`);

      const provider = new RpcProvider({ nodeUrl: rpcUrl });

      // Test the provider by getting chain ID
      const chainId = await provider.getChainId();

      // Verify it's Sepolia
      if (chainId !== SN_SEPOLIA_CHAIN_ID) {
        console.warn(`⚠️  ${rpcName} returned wrong chain ID: ${chainId}`);
        continue;
      }

      // Success! Cache and return
      cachedProvider = provider;
      cachedRpcUrl = rpcUrl;
      console.log(`✔ Connected to Starknet Sepolia using ${rpcName} RPC`);
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
  if (rpcUrl.includes('nethermind')) return 'Nethermind';
  if (rpcUrl.includes('lava')) return 'Lava';
  if (rpcUrl.includes('blastapi')) return 'BlastAPI';
  if (rpcUrl.includes('NEXT_PUBLIC_STARKNET_RPC') || process.env.NEXT_PUBLIC_STARKNET_RPC) {
    return 'Custom RPC';
  }
  return 'Unknown';
}

/**
 * Validate that the provider is connected to Starknet Sepolia
 * @param provider The RPC provider to validate
 * @throws Error with descriptive message if validation fails
 */
export async function validateStarknetNetwork(provider: RpcProvider): Promise<void> {
  try {
    const chainId = await provider.getChainId();

    if (chainId !== SN_SEPOLIA_CHAIN_ID) {
      throw new Error(
        `Connected wallet is not on Starknet Sepolia. Expected: ${SN_SEPOLIA_CHAIN_ID}, Got: ${chainId}`
      );
    }
  } catch (error: any) {
    if (error.message?.includes('not on Starknet Sepolia')) {
      throw error;
    }
    
    // RPC unreachable error
    const rpcUrl = (provider as any).baseURL || (provider as any).nodeUrl || 'Unknown RPC';
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

