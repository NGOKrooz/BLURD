'use client';

import { Provider, Contract, Account, RpcProvider } from 'starknet';
import { STARKNET_RPC, PAYMENT_CONTRACT } from '../../../../config/starknet';
// TODO: replace with actual compiled ABI
// import paymentAbi from '@/lib/abis/payment_proof.json';

declare global {
  interface Window {
    starknet?: any;
    starknet_braavos?: any;
    starknet_argentX?: any;
  }
}

// Fix Cairo version detection with graceful fallback
let provider: Provider;
try {
  // Try to create provider with explicit nodeUrl
  provider = new Provider({ 
    rpc: { 
      nodeUrl: STARKNET_RPC || 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7' 
    } 
  });
} catch (error) {
  console.warn('Failed to create Provider, using RpcProvider fallback:', error);
  // Fallback to RpcProvider if Provider fails
  try {
    provider = new RpcProvider({ 
      nodeUrl: STARKNET_RPC || 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7' 
    }) as any;
  } catch (fallbackError) {
    console.error('Both Provider and RpcProvider failed, using default testnet RPC:', fallbackError);
    // Last resort: use public testnet RPC
    provider = new Provider({ 
      rpc: { 
        nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7' 
      } 
    });
  }
}

export async function detectAndConnectWallet() {
  const candidate =
    (typeof window !== 'undefined' &&
      (window.starknet_braavos ||
        window.starknet_argentX ||
        window.starknet)) ||
    null;

  if (!candidate) {
    throw new Error('No Starknet wallet detected');
  }

  await candidate.enable({ showModal: true });
  return candidate;
}

export async function getStarknetBalance(address: string): Promise<bigint> {
  try {
    // Fetch STR balance from Starknet testnet
    // For Starknet, we need to call the ERC20 contract for STR token
    // For MVP/hackathon demo, we'll use a placeholder or fetch from a known STR contract
    
    // Option 1: Use placeholder for demo (comment out for production)
    // return BigInt(Math.floor(Math.random() * 100 * 1e18)); // Random 0-100 STR for demo
    
    // Option 2: Try to fetch from STR token contract (if available)
    // The STR token contract address on Sepolia testnet
    // For now, return a placeholder that can be replaced with actual contract call
    try {
      // In production, you would call the STR ERC20 contract's balanceOf function
      // For hackathon demo, return a placeholder value
      const placeholderBalance = 10.5; // 10.5 STR for demo
      return BigInt(Math.floor(placeholderBalance * 1e18));
    } catch (contractError) {
      console.warn('Failed to fetch from STR contract, using placeholder:', contractError);
      // Fallback placeholder for demo
      return BigInt(Math.floor(10.5 * 1e18)); // 10.5 STR
    }
  } catch (error) {
    console.warn('Failed to fetch STR balance, using placeholder:', error);
    // Graceful fallback: return placeholder for hackathon demo
    return BigInt(Math.floor(10.5 * 1e18)); // 10.5 STR
  }
}

export async function sendStarknetPayment({
  recipient,
  amount,
  proofHash,
}: {
  recipient: string;
  amount: string;
  proofHash?: string | null;
}) {
  try {
    const wallet = await detectAndConnectWallet();

    if (!wallet || !wallet.selectedAddress) {
      throw new Error('Wallet not connected');
    }

    // Create account with error handling for Cairo version detection
    let account: Account;
    try {
      // Try to create account - Starknet.js will auto-detect Cairo version
      account = new Account(provider, wallet.selectedAddress, wallet.signer);
    } catch (cairoError: any) {
      // Handle Cairo version detection errors gracefully
      if (cairoError.message?.includes('Cairo version') || cairoError.message?.includes('Unable to determine')) {
        console.warn('Cairo version detection warning (continuing anyway):', cairoError.message);
        // Try to create account with explicit Cairo version fallback
        try {
          // Try Cairo 1.0 first (most common)
          account = new Account(provider, wallet.selectedAddress, wallet.signer, '1' as any);
        } catch (fallbackError) {
          console.warn('Cairo 1.0 fallback failed, trying Cairo 2.0:', fallbackError);
          try {
            // Try Cairo 2.0
            account = new Account(provider, wallet.selectedAddress, wallet.signer, '2' as any);
          } catch (fallback2Error) {
            console.warn('All Cairo version fallbacks failed, using original error:', fallback2Error);
            // If all fallbacks fail, throw the original error
            throw cairoError;
          }
        }
      } else {
        throw cairoError;
      }
    }

    const contract = new Contract([] as any, PAYMENT_CONTRACT, account);

    // Convert amount to felt252 (multiply by 10^18 for STR)
    const feltAmount = BigInt(Math.floor(Number(amount) * 1e18));
    
    // Convert proof hash to felt252 if provided
    let feltProof = 0n;
    if (proofHash) {
      try {
        // Try to parse as hex string first
        if (proofHash.startsWith('0x')) {
          feltProof = BigInt(proofHash);
        } else {
          // If not hex, try to convert string to felt252
          feltProof = BigInt(proofHash);
        }
      } catch (parseError) {
        console.warn('Failed to parse proof hash, using 0:', parseError);
        feltProof = 0n;
      }
    }

    const tx = await contract.store_payment(
      wallet.selectedAddress,
      recipient,
      feltAmount,
      feltProof
    );

    return tx.transaction_hash as string;
  } catch (error: any) {
    console.error('Payment transaction failed:', error);
    // Provide user-friendly error messages
    if (error.message?.includes('Cairo version')) {
      throw new Error('Network configuration issue. Please try again or check your wallet connection.');
    }
    throw error;
  }
}

export async function verifyStarknetPayment(sender: string, receiver: string) {
  const contract = new Contract([] as any, PAYMENT_CONTRACT, provider);

  const data = await contract.get_payment(sender, receiver);

  return {
    sender: data.sender,
    receiver: data.receiver,
    amount: data.amount,
    proofHash: data.proof_hash,
    timestamp: data.timestamp,
  };
}


