/**
 * Starknet Private Payment Service
 * Handles STRK payments with privacy commitments
 */

import { Contract, uint256 } from 'starknet';
import { getProvider, checkNetwork, SN_SEPOLIA_CHAIN_ID } from '../starknet';
import privatePaymentAbi from '../abis/private-payment.json';
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
}

export interface PaymentResult {
  txHash: string;
  commitment: string;
  blockNumber?: number;
  status: string;
}

/**
 * Send private payment through the contract
 */
export async function sendPrivatePayment({
  recipient,
  amount,
  commitment,
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

    // Step 2: Get wallet
    if (typeof window === 'undefined') {
      throw new Error('Browser environment required');
    }

    const wallet = window.starknet_braavos || window.starknet_argentX || window.starknet;
    if (!wallet || !wallet.selectedAddress) {
      throw new Error('Wallet not connected. Please connect your Starknet wallet.');
    }

    // Step 3: Check network
    const networkCheck = await checkNetwork();
    if (!networkCheck.valid) {
      throw new Error(networkCheck.error || 'Please switch to Starknet Sepolia network.');
    }

    // Step 4: Get provider and contract (using robust RPC system)
    const provider = await getProvider();
    const contractAddress = getContractAddress();

    // Step 5: Generate commitment if not provided
    const nonce = generateNonce();
    const amountWeiStr = BigInt(Math.floor(amountNum * 1e18)).toString();
    const finalCommitment = commitment || generatePrivacyCommitment(
      wallet.selectedAddress,
      recipient,
      amountWeiStr,
      nonce
    );

    // Step 6: Convert amount to u128 (wei)
    const amountWei = uint256.bnToUint256(BigInt(Math.floor(amountNum * 1e18)));

    // Step 7: Create contract instance
    const contract = new Contract(privatePaymentAbi, contractAddress, wallet);

    // Step 8: Send transaction
    console.log('Sending private payment:', {
      recipient,
      amount: amountWei,
      commitment: finalCommitment,
    });

    const result = await contract.send_private_payment(
      recipient,
      amountWei,
      finalCommitment
    );

    console.log('Transaction sent:', result.transaction_hash);

    // Step 9: Wait for confirmation
    const receipt = await provider.waitForTransaction(result.transaction_hash);
    console.log('Transaction confirmed');

    return {
      txHash: result.transaction_hash,
      commitment: finalCommitment,
      blockNumber: (receipt as any).block_number,
      status: (receipt as any).status || 'ACCEPTED_ON_L2',
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
      throw new Error('Insufficient STRK balance');
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
 * Verify payment commitment by checking emitted events
 */
export async function verifyPaymentCommitment(
  commitmentHash: string
): Promise<VerifiedPayment | null> {
  try {
    const provider = await getProvider();
    const contractAddress = getContractAddress();

    const contract = new Contract(privatePaymentAbi, contractAddress, provider);

    // Check if commitment exists
    const exists = await contract.verify_commitment(commitmentHash);

    if (!exists) {
      return null;
    }

    // Query events (simplified implementation)
    const events = await (provider as any).getEvents({
      address: contractAddress,
      from_block: { block_number: 0 },
      to_block: 'latest',
      chunk_size: 100,
    });

    for (const event of events.events || []) {
      if (event.keys?.length >= 2 && event.data?.length >= 3) {
        const eventCommitment = event.data[2];

        if (eventCommitment === commitmentHash) {
          return {
            sender: event.keys[0],
            recipient: event.keys[1],
            amount: (BigInt(event.data[0]) / BigInt(1e18)).toString(),
            commitment: eventCommitment,
            timestamp: parseInt(event.data[3] || '0'),
            txHash: event.transaction_hash,
            blockNumber: event.block_number,
          };
        }
      }
    }

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
    const contractAddress = getContractAddress();

    const events = await (provider as any).getEvents({
      address: contractAddress,
      from_block: { block_number: 0 },
      to_block: 'latest',
      chunk_size: 100,
      keys: type === 'sent' ? [[address]] : [[], [address]],
    });

    const payments: VerifiedPayment[] = [];

    for (const event of events.events || []) {
      if (event.keys?.length >= 2 && event.data?.length >= 4) {
        payments.push({
          sender: event.keys[0],
          recipient: event.keys[1],
          amount: (BigInt(event.data[0]) / BigInt(1e18)).toString(),
          commitment: event.data[2],
          timestamp: parseInt(event.data[3]),
          txHash: event.transaction_hash,
          blockNumber: event.block_number,
        });
      }
    }

    return payments;
  } catch (error: any) {
    console.error('getPaymentHistory error:', error);
    return [];
  }
}
