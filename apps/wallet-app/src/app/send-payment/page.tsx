'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
// Note: In production, these would be imported from a shared package
// For demo, using simplified implementations
class ZcashClient {
  async generateShieldedAddress() {
    return { zAddress: `ztestsapling${Math.random().toString(36).substring(7)}`, viewingKey: `viewkey${Math.random().toString(36).substring(7)}` };
  }
  async getBalance() { return 1.5; }
  async sendShieldedPayment(to: string, amount: number, memo?: string) {
    const txid = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    return { txid, amount, proofHash: memo, confirmed: false };
  }
}

class PaymentService {
  constructor(private client: ZcashClient) {}
  async sendPaymentWithProof(payment: any) {
    return await this.client.sendShieldedPayment(payment.toAddress, payment.amount, payment.proofHash);
  }
}

export default function SendPayment() {
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('0.1');
  const [toAddress, setToAddress] = useState('');
  const [proofHash, setProofHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const hash = searchParams.get('proofHash');
    if (hash) {
      setProofHash(hash);
    }

    // Initialize wallet and get balance
    const initWallet = async () => {
      const client = new ZcashClient('testnet');
      const address = await client.generateShieldedAddress();
      setToAddress(address.zAddress);
      const bal = await client.getBalance(address.zAddress);
      setBalance(bal);
    };
    initWallet();
  }, [searchParams]);

  const handleSend = async () => {
    if (!proofHash) {
      alert('Please generate a proof first or enter a proof hash');
      return;
    }

    if (!toAddress) {
      alert('Please enter a recipient address');
      return;
    }

    setLoading(true);
    try {
      const client = new ZcashClient('testnet');
      const paymentService = new PaymentService(client);

      // Mock proof for binding
      const mockProof = { proofHash };

      const paymentResult = await paymentService.sendPaymentWithProof({
        amount: parseFloat(amount),
        toAddress,
        proof: mockProof,
        proofHash,
      });

      // Store payment in API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      await fetch(`${apiUrl}/api/payments/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txid: paymentResult.txid,
          amount: paymentResult.amount,
          proofHash: paymentResult.proofHash,
        }),
      });

      setResult(paymentResult);
    } catch (error: any) {
      alert(`Error sending payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Send Shielded Payment</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          {balance !== null && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-300">Your Balance</p>
              <p className="text-2xl font-bold">{balance.toFixed(8)} ZEC</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proof Hash</label>
              <input
                type="text"
                value={proofHash}
                onChange={(e) => setProofHash(e.target.value)}
                placeholder="Enter proof hash from generated proof"
                className="w-full p-3 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                This links your payment to your ZK proof
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Recipient Address (z-address)</label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="ztestsapling..."
                className="w-full p-3 border rounded font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount (ZEC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.00000001"
                min="0"
                className="w-full p-3 border rounded"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || !proofHash || !toAddress}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Shielded Payment'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">Payment Sent!</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <p className="font-mono text-sm break-all">{result.txid}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <p className="font-semibold">{result.amount} ZEC</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Proof Hash:</span>
                <p className="font-mono text-sm break-all">{result.proofHash}</p>
              </div>
            </div>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              Return to Home →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

