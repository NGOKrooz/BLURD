'use client';

import { Provider, Contract, Account } from 'starknet';
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

export const provider = new Provider({ rpc: { nodeUrl: STARKNET_RPC } });

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

export async function getStarknetBalance(address: string) {
  // For Starknet.js v5, balances are typically fetched via token contracts.
  // This is a placeholder for MVP; extend with actual ERC20/ERC721 calls as needed.
  return 0n;
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
  const wallet = await detectAndConnectWallet();

  const account = new Account(provider, wallet.selectedAddress, wallet.signer);

  const contract = new Contract([] as any, PAYMENT_CONTRACT, account);

  const feltAmount = BigInt(Math.floor(Number(amount) * 1e6));
  const feltProof = proofHash ? BigInt(proofHash) : 0n;

  const tx = await contract.store_payment(
    wallet.selectedAddress,
    recipient,
    feltAmount,
    feltProof
  );

  return tx.transaction_hash as string;
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


