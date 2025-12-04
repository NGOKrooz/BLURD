/**
 * Ethereum Private Payment Service
 * Handles ETH payments with privacy commitments (Aztec-style)
 */

import { ethers } from 'ethers';
import { getProvider, checkNetwork, ETHEREUM_SEPOLIA_CHAIN_ID, AZTEC_SEPOLIA_CHAIN_ID } from '../ethereum';
import { generateCommitment as generatePrivacyCommitment, generateNonce } from '../../utils/privacy';

// Get contract address from environment
const getContractAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error('Payment contract not configured. Set NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS in .env.local');
  }
  return address;
};

export interface SendPrivatePaymentParams {
  recipient: string;
  amount: string;
  commitment?: string;
  signer: ethers.JsonRpcSigner;
}

export interface PaymentResult {
  txHash: string;
  commitment: string;
  blockNumber?: number;
  status: string;
}

/**
 * Send private payment through the contract
 * Uses commitment-based privacy (similar to Aztec's approach)
 */
export async function sendPrivatePayment({
  recipient,
  amount,
  commitment,
  signer,
}: SendPrivatePaymentParams): Promise<PaymentResult> {
  try {
    // Step 1: Validate inputs
    if (!recipient || !amount) {
      throw new Error('Recipient and amount are required');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount. Must be greater than 0');
    }

    // Step 2: Check network
    const networkCheck = await checkNetwork();
    if (!networkCheck.valid) {
      throw new Error(networkCheck.error || 'Please switch to Ethereum Sepolia or Aztec Sepolia network.');
    }

    // Step 3: Get provider
    const provider = await getProvider();
    const contractAddress = getContractAddress();

    // Step 4: Generate commitment if not provided
    const nonce = generateNonce();
    const amountWeiStr = BigInt(Math.floor(amountNum * 1e18)).toString();
    const finalCommitment = commitment || generatePrivacyCommitment(
      await signer.getAddress(),
      recipient,
      amountWeiStr,
      nonce
    );

    // Step 5: Convert amount to wei
    const amountWei = ethers.parseEther(amount);

    // Step 6: Send transaction
    // For MVP: Send ETH directly with commitment hash as transaction data
    // In production: Use a proper privacy contract that handles commitments
    console.log('Sending private payment:', {
      recipient,
      amount: amountWei.toString(),
      commitment: finalCommitment,
    });

    // Encode commitment in transaction data (first 32 bytes)
    const commitmentBytes = ethers.hexlify(ethers.toUtf8Bytes(finalCommitment.slice(0, 32)));
    
    const tx = await signer.sendTransaction({
      to: recipient,
      value: amountWei,
      data: commitmentBytes,
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed');

    return {
      txHash: tx.hash,
      commitment: finalCommitment,
      blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : undefined,
      status: receipt?.status === 1 ? 'SUCCEEDED' : 'FAILED',
    };
  } catch (error: any) {
    console.error('sendPrivatePayment error:', error);
    
    // User-friendly error messages
    if (error.message?.includes('Amount must be > 0')) {
      throw new Error('Amount must be greater than 0');
    }
    if (error.message?.includes('Invalid recipient')) {
      throw new Error('Invalid recipient address');
    }
    if (error.message?.includes('rejected')) {
      throw new Error('Transaction rejected by user');
    }
    if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
      throw new Error('Insufficient ETH balance');
    }
    
    throw error;
  }
}

export interface VerifiedPayment {
  sender: string;
  recipient: string;
  amount: string;
  commitment: string;
  timestamp: number;
  txHash: string;
  blockNumber?: number;
}

/**
 * Verify payment commitment by checking transaction data
 */
export async function verifyPaymentCommitment(
  commitmentHash: string
): Promise<VerifiedPayment | null> {
  try {
    const provider = await getProvider();
    const contractAddress = getContractAddress();

    // Query transaction events (simplified implementation)
    // In production, you'd query a privacy contract for commitments
    // For MVP, we'll check transaction data for commitment hashes
    
    // This is a placeholder - in production, use contract events
    return null;
  } catch (error: any) {
    console.error('verifyPaymentCommitment error:', error);
    throw new Error(`Verification failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get payment history for an address
 */
export async function getPaymentHistory(
  address: string,
  type: 'sent' | 'received' = 'sent'
): Promise<VerifiedPayment[]> {
  try {
    const provider = await getProvider();
    
    // This is a placeholder - in production, query contract events
    // For MVP, return empty array
    return [];
  } catch (error: any) {
    console.error('getPaymentHistory error:', error);
    return [];
  }
}

