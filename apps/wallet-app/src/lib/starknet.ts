'use client';

import { RpcProvider, Contract, Account } from 'starknet';
import privatePaymentAbi from '@/lib/abis/private-payment.json';

declare global {
  interface Window {
    starknet?: any;
    starknet_braavos?: any;
    starknet_argentX?: any;
  }
}

// Starknet Sepolia chain ID
const SN_SEPOLIA_CHAIN_ID = '0x534e5f5345504f4c4941';

// STRK token contract on Starknet Sepolia
const STRK_TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

// ETH token contract on Starknet Sepolia  
const ETH_TOKEN_ADDRESS = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

// Default Sepolia RPC endpoint
const DEFAULT_RPC_URL = 'https://starknet-sepolia.public.blastapi.io';

// Get contract address from environment
const getContractAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS;
  if (!address) {
    console.warn('NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS not set');
    return '';
  }
  return address;
};

// Get RPC URL from environment or use default
const getRpcUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envRpc = process.env.NEXT_PUBLIC_STARKNET_RPC;
    if (envRpc) return envRpc;
  }
  return DEFAULT_RPC_URL;
};

// Create a single shared RpcProvider instance
let providerInstance: RpcProvider | null = null;

export function getProvider(): RpcProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const rpcUrl = getRpcUrl();
  
  try {
    providerInstance = new RpcProvider({ 
      nodeUrl: rpcUrl 
    });
    console.log('RpcProvider initialized with:', rpcUrl);
  } catch (error) {
    console.error('Failed to create RpcProvider:', error);
    // Fallback to default
    providerInstance = new RpcProvider({ 
      nodeUrl: DEFAULT_RPC_URL 
    });
  }

  return providerInstance;
}

// Export provider for use in other modules
export const provider = getProvider();

/**
 * Detect and connect to Starknet wallet (Argent X or Braavos)
 */
export async function detectAndConnectWallet() {
  const candidate =
    (typeof window !== 'undefined' &&
      (window.starknet_braavos ||
        window.starknet_argentX ||
        window.starknet)) ||
    null;

  if (!candidate) {
    throw new Error('No Starknet wallet detected. Please install Argent X or Braavos.');
  }

  await candidate.enable({ showModal: true });
  return candidate;
}

/**
 * Check if wallet is on Starknet Sepolia network
 */
export async function checkNetwork(): Promise<{ valid: boolean; chainId: string; error?: string }> {
  try {
    const provider = getProvider();
    const chainId = await provider.getChainId();
    
    if (chainId !== SN_SEPOLIA_CHAIN_ID) {
      return {
        valid: false,
        chainId,
        error: 'Please switch your wallet to Starknet Sepolia network.'
      };
    }
    
    return { valid: true, chainId };
  } catch (error: any) {
    console.error('Network check failed:', error);
    return {
      valid: false,
      chainId: '',
      error: 'Failed to check network. Please verify your RPC connection.'
    };
  }
}

/**
 * Get STRK balance for an address
 */
export async function getStarknetBalance(address: string): Promise<bigint> {
  try {
    const provider = getProvider();
    
    if (!address) {
      console.error('getStarknetBalance: Address is required');
      return 0n;
    }

    // Call balanceOf on the STRK token contract
    const result = await provider.callContract({
      contractAddress: STRK_TOKEN_ADDRESS,
      entrypoint: 'balanceOf',
      calldata: [address],
    });
    
    // Result is uint256 (low, high) - combine them
    const resultArray = (result as any).result || result;
    const low = BigInt(resultArray[0] || '0');
    const high = BigInt(resultArray[1] || '0');
    const balance = low + (high << 128n);
    
    return balance;
  } catch (error: any) {
    console.error('Failed to fetch STRK balance:', error);
    return 0n;
  }
}

/**
 * Get ETH balance for an address
 */
export async function getEthBalance(address: string): Promise<bigint> {
  try {
    const provider = getProvider();
    
    if (!address) {
      return 0n;
    }

    const result = await provider.callContract({
      contractAddress: ETH_TOKEN_ADDRESS,
      entrypoint: 'balanceOf',
      calldata: [address],
    });
    
    const resultArray = (result as any).result || result;
    const low = BigInt(resultArray[0] || '0');
    const high = BigInt(resultArray[1] || '0');
    const balance = low + (high << 128n);
    
    return balance;
  } catch (error: any) {
    console.error('Failed to fetch ETH balance:', error);
    return 0n;
  }
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
 * Send STRK payment through the contract
 */
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
    // Step 1: Check if wallet is available
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    const wallet = await detectAndConnectWallet();

    if (!wallet) {
      throw new Error('Wallet not connected. Please connect your Starknet wallet.');
    }

    if (!wallet.selectedAddress) {
      throw new Error('No account selected. Please select an account in your wallet.');
    }

    // Step 2: Get provider
    const provider = getProvider();

    // Step 3: Check network - must be Starknet Sepolia
    const networkCheck = await checkNetwork();
    if (!networkCheck.valid) {
      throw new Error(networkCheck.error || 'Wrong network. Please switch to Starknet Sepolia.');
    }

    // Step 4: Create account
    let account: Account;
    try {
      account = new Account(provider, wallet.selectedAddress, wallet.signer);
    } catch (accountError: any) {
      console.error('Account creation error:', accountError);
      throw new Error('Failed to initialize account. Please reconnect your wallet.');
    }

    // Step 5: Validate contract address
    const contractAddress = getContractAddress();
    if (!contractAddress) {
      throw new Error('Payment contract address not configured. Please set NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS.');
    }

    // Step 6: Validate recipient
    if (!recipient || recipient.length < 10 || !recipient.startsWith('0x')) {
      throw new Error('Invalid recipient address. Please enter a valid Starknet address.');
    }

    // Step 7: Convert amount to u128 (wei)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount. Please enter a valid positive number.');
    }
    const amountWei = BigInt(Math.floor(amountNum * 1e18));

    // Step 8: Create contract instance
    const contract = new Contract(privatePaymentAbi, contractAddress, account);

    // Step 9: Verify contract exists
    try {
      await provider.getClassAt(contractAddress);
    } catch (contractCheckError: any) {
      console.error('Contract verification failed:', contractCheckError);
      throw new Error('Contract not found. Please verify the contract is deployed on Sepolia.');
    }

    // Step 10: Send transaction
    console.log('Sending payment:', { recipient, amount: amountWei.toString() });
    
    let tx;
    try {
      tx = await contract.send_private_payment(recipient, amountWei);
      console.log('Transaction sent:', tx.transaction_hash);
      
      // Wait for confirmation
      await provider.waitForTransaction(tx.transaction_hash);
      console.log('Transaction confirmed');
    } catch (txError: any) {
      console.error('Transaction error:', txError);
      
      if (txError.message?.includes('insufficient') || txError.message?.includes('balance')) {
        throw new Error('Insufficient STRK balance for this transaction.');
      }
      if (txError.message?.includes('rejected') || txError.message?.includes('user')) {
        throw new Error('Transaction rejected by user.');
      }
      if (txError.message?.includes('revert') || txError.message?.includes('failed')) {
        throw new Error('Transaction reverted. Check contract parameters.');
      }
      
      throw new Error(`Transaction failed: ${txError.message || 'Unknown error'}`);
    }

    return tx.transaction_hash as string;
  } catch (error: any) {
    console.error('sendStarknetPayment error:', error);
    throw error;
  }
}

/**
 * Verify a payment transaction
 */
export async function verifyStarknetPayment(txHash: string) {
  const provider = getProvider();
  
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      throw new Error('Transaction not found');
    }

    const status = (receipt as any).status || (receipt as any).execution_status;
    
    if (status !== 'ACCEPTED_ON_L2' && status !== 'ACCEPTED_ON_L1' && status !== 'SUCCEEDED') {
      throw new Error(`Transaction failed with status: ${status}`);
    }

    return {
      txHash,
      status,
      blockNumber: (receipt as any).block_number,
    };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    throw new Error(`Failed to verify payment: ${error.message || 'Unknown error'}`);
  }
}

// Export chain ID for external use
export { SN_SEPOLIA_CHAIN_ID, STRK_TOKEN_ADDRESS, ETH_TOKEN_ADDRESS };
