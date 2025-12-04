/**
 * Starknet Configuration
 * Network: Starknet Sepolia Testnet
 */

// Default Starknet Sepolia RPC endpoint
const DEFAULT_RPC = 'https://starknet-sepolia.public.blastapi.io';

// Get RPC URL from environment or use default
export const STARKNET_RPC = 
  process.env.NEXT_PUBLIC_STARKNET_RPC ||
  process.env.STARKNET_RPC_URL ||
  DEFAULT_RPC;

// Get payment contract address from environment
export const PAYMENT_CONTRACT = 
  process.env.NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_STARKNET_PAYMENT_CONTRACT ||
  '';

// Chain ID for Starknet Sepolia
export const CHAIN_ID = '0x534e5f5345504f4c4941'; // SN_SEPOLIA

// Token addresses on Starknet Sepolia
export const STRK_TOKEN = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
export const ETH_TOKEN = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
