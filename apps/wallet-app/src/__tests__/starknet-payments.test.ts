import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendStarknetPayment, verifyStarknetPayment } from '../lib/starknet';

vi.mock('starknet', () => {
  class MockAccount {
    constructor(public provider: any, public address: string, public signer: any) {}
  }
  class MockContract {
    constructor(public abi: any, public address: string, public accountOrProvider: any) {}
    async store_payment(sender: string, receiver: string, amount: bigint, proofHash: bigint) {
      return { transaction_hash: '0xmocktx' };
    }
    async get_payment(sender: string, receiver: string) {
      return {
        sender,
        receiver,
        amount: 100n,
        proof_hash: 0n,
        timestamp: 123456n,
      };
    }
  }
  const MockProvider = class {
    async getBalance() {
      return { balance: 1000n };
    }
  };
  return {
    Provider: MockProvider,
    Contract: MockContract,
    Account: MockAccount,
  };
});

describe('Starknet payments', () => {
  beforeEach(() => {
    (global as any).window = {
      starknet_braavos: {
        selectedAddress: '0xsender',
        signer: {},
        enable: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  it('sends payment and returns tx hash', async () => {
    const txHash = await sendStarknetPayment({
      recipient: '0xreceiver',
      amount: '1.0',
      proofHash: '0x1',
    });
    expect(txHash).toBe('0xmocktx');
  });

  it('verifies payment via contract', async () => {
    const data = await verifyStarknetPayment('0xsender', '0xreceiver');
    expect(data.sender).toBe('0xsender');
    expect(data.receiver).toBe('0xreceiver');
  });
});


