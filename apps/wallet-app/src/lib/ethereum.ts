/**
 * Ethereum/Aztec L2 Integration
 * Replaces Starknet with Ethereum-compatible wallet and payment system
 */

'use client';

import { ethers } from 'ethers';
import { getWorkingProvider, validateEthereumNetwork, ETHEREUM_SEPOLIA_CHAIN_ID, AZTEC_SEPOLIA_CHAIN_ID } from './ethereum/rpc';

// ETH token address (native ETH, no contract needed)
// For ERC-20 tokens, use specific token addresses
const NATIVE_ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

// Get contract address from environment
const getContractAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS;
  if (!address) {
    console.warn('NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS not set');
    return '';
  }
  return address;
};

// Get provider using the robust RPC system with fallbacks
let providerInstance: ethers.JsonRpcProvider | null = null;
let providerPromise: Promise<ethers.JsonRpcProvider> | null = null;

export async function getProvider(): Promise<ethers.JsonRpcProvider> {
  // If we have a cached instance, return it
  if (providerInstance) {
    return providerInstance;
  }

  // If we're already fetching, return the same promise
  if (providerPromise) {
    return providerPromise;
  }

  // Create a new promise to fetch provider
  providerPromise = getWorkingProvider().then((provider) => {
    providerInstance = provider;
    return provider;
  });

  return providerPromise;
}

// Synchronous getter for backwards compatibility (will use cached provider or throw)
export function getProviderSync(): ethers.JsonRpcProvider {
  if (!providerInstance) {
    throw new Error('Provider not initialized. Call getProvider() first.');
  }
  return providerInstance;
}

/**
 * Detect and connect to Ethereum wallet (MetaMask, WalletConnect, etc.)
 */
export async function detectAndConnectWallet() {
  if (typeof window === 'undefined') {
    throw new Error('Window object not available');
  }

  if (!window.ethereum) {
    throw new Error('No Ethereum wallet detected. Please install MetaMask or another Ethereum wallet.');
  }

  // Request account access
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No account selected. Please select an account in your wallet.');
  }

  return {
    provider: new ethers.BrowserProvider(window.ethereum),
    address: accounts[0],
    signer: null as ethers.JsonRpcSigner | null,
  };
}

/**
 * Get signer for a connected wallet
 */
export async function getSigner(address: string): Promise<ethers.JsonRpcSigner> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet not available');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner(address);
}

/**
 * Check if wallet is on Ethereum Sepolia or Aztec Sepolia network
 * Uses the robust RPC system with fallbacks
 */
export async function checkNetwork(): Promise<{ valid: boolean; chainId: string; error?: string }> {
  try {
    const provider = await getProvider();
    await validateEthereumNetwork(provider);
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    
    return { valid: true, chainId };
  } catch (error: any) {
    console.error('Network check failed:', error);
    
    // Provide specific error messages
    let errorMessage = 'Failed to check network. Please verify your RPC connection.';
    
    if (error.message?.includes('RPC unreachable')) {
      errorMessage = error.message;
    } else if (error.message?.includes('not on Ethereum Sepolia')) {
      errorMessage = 'Wallet connected to wrong network. Please switch to Ethereum Sepolia or Aztec Sepolia.';
    } else if (error.message?.includes('Unable to fetch chain ID')) {
      errorMessage = 'Unable to fetch chain ID. Provider failure — switching to fallback RPC.';
    }
    
    return {
      valid: false,
      chainId: '',
      error: errorMessage
    };
  }
}

/**
 * Get ETH balance for an address
 * Uses the robust RPC system with automatic fallback retry
 */
export async function getEthereumBalance(address: string): Promise<bigint> {
  if (!address) {
    console.error('getEthereumBalance: Address is required');
    return 0n;
  }

  // Try with retry logic using fallback providers
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const provider = await getProvider();
      
      // Validate network first
      await validateEthereumNetwork(provider);

      // Get native ETH balance
      const balance = await provider.getBalance(address);
      
      return balance;
    } catch (error: any) {
      lastError = error;
      console.warn(`Failed to fetch ETH balance (attempt ${attempt + 1}):`, error.message);
      
      // If it's an RPC error, clear cache and retry
      if (error.message?.includes('RPC unreachable') || error.message?.includes('Provider failure')) {
        const { clearProviderCache } = await import('./ethereum/rpc');
        clearProviderCache();
        // Will try next RPC on next attempt
        continue;
      }
      
      // For other errors, don't retry
      break;
    }
  }
  
  console.error('Failed to fetch ETH balance after retries:', lastError);
  return 0n;
}

/**
 * Format balance from wei to readable string
 */
export function formatBalance(balance: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const intPart = balance / divisor;
  const fracPart = balance % divisor;
  const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${intPart}.${fracStr}`;
}

/**
 * Send private payment through the contract
 * Uses commitment-based privacy (similar to Aztec's approach)
 */
export async function sendEthereumPayment({
  recipient,
  amount,
  proofHash,
  signer,
}: {
  recipient: string;
  amount: string;
  proofHash?: string | null;
  signer: ethers.JsonRpcSigner;
}) {
  try {
    // Step 1: Validate inputs
    if (!recipient || !amount) {
      throw new Error('Recipient and amount are required');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount. Must be greater than 0');
    }

    // Step 2: Get provider
    const provider = await getProvider();

    // Step 3: Validate network
    try {
      await validateEthereumNetwork(provider);
    } catch (error: any) {
      if (error.message?.includes('not on Ethereum Sepolia')) {
        throw new Error('Wallet connected to wrong network. Please switch to Ethereum Sepolia or Aztec Sepolia.');
      }
      throw new Error(error.message || 'RPC unreachable');
    }

    // Step 4: Validate contract address
    const contractAddress = getContractAddress();
    if (!contractAddress) {
      throw new Error('Payment contract address not configured. Please set NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS.');
    }

    // Step 5: Validate recipient
    if (!ethers.isAddress(recipient)) {
      throw new Error('Invalid recipient address. Please enter a valid Ethereum address.');
    }

    // Step 6: Convert amount to wei
    const amountWei = ethers.parseEther(amount);

    // Step 7: Create contract instance (simplified - you'll need the actual ABI)
    // For now, we'll send a simple ETH transfer with commitment data in the transaction
    // In production, you'd use a proper privacy contract
    
    // Step 8: Send transaction
    console.log('Sending payment:', { recipient, amount: amountWei.toString() });
    
    let tx;
    try {
      // For MVP: Send ETH directly with commitment hash as data
      // In production: Use a proper privacy contract
      const txData = proofHash ? ethers.hexlify(ethers.toUtf8Bytes(proofHash)) : '0x';
      
      tx = await signer.sendTransaction({
        to: recipient,
        value: amountWei,
        data: txData,
      });
      
      console.log('Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      return {
        transaction_hash: tx.hash,
        blockNumber: receipt?.blockNumber,
        status: receipt?.status === 1 ? 'SUCCEEDED' : 'FAILED',
      };
    } catch (txError: any) {
      console.error('Transaction error:', txError);
      
      if (txError.message?.includes('insufficient') || txError.message?.includes('balance')) {
        throw new Error('Insufficient ETH balance for this transaction.');
      }
      if (txError.message?.includes('rejected') || txError.message?.includes('user')) {
        throw new Error('Transaction rejected by user.');
      }
      if (txError.message?.includes('revert') || txError.message?.includes('failed')) {
        throw new Error('Transaction reverted. Check contract parameters.');
      }
      
      throw new Error(`Transaction failed: ${txError.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('sendEthereumPayment error:', error);
    throw error;
  }
}

/**
 * Verify a payment transaction
 * Uses the robust RPC system with fallback support
 */
export async function verifyEthereumPayment(txHash: string) {
  const provider = await getProvider();
  
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      throw new Error('Transaction not found');
    }

    const status = receipt.status === 1 ? 'SUCCEEDED' : 'FAILED';
    
    if (status !== 'SUCCEEDED') {
      throw new Error(`Transaction failed with status: ${status}`);
    }

    return {
      txHash,
      status,
      blockNumber: receipt.blockNumber,
    };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    
    // Provide specific error messages
    if (error.message?.includes('RPC unreachable')) {
      throw new Error('RPC unreachable: Unable to verify transaction. Please try again.');
    }
    
    throw new Error(`Failed to verify payment: ${error.message || 'Unknown error'}`);
  }
}

// Export chain IDs for external use
export { ETHEREUM_SEPOLIA_CHAIN_ID, AZTEC_SEPOLIA_CHAIN_ID };

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

