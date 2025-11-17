'use client';

import { useState } from 'react';
import Link from 'next/link';

interface VerificationResult {
  zkVerified: boolean;
  paymentExists: boolean;
  paymentConfirmed: boolean;
  proofHashMatches: boolean;
  combinedState: string;
}

export default function Verify() {
  const [proofJson, setProofJson] = useState('');
  const [publicSignalsJson, setPublicSignalsJson] = useState('');
  const [txid, setTxid] = useState('');
  const [proofHash, setProofHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!proofJson || !publicSignalsJson) {
      setError('Please provide both proof and public signals');
      return;
    }

    if (!txid && !proofHash) {
      setError('Please provide either transaction ID or proof hash');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let proof, publicSignals;

      try {
        proof = JSON.parse(proofJson);
        publicSignals = JSON.parse(publicSignalsJson);
      } catch (e) {
        throw new Error('Invalid JSON in proof or public signals');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

      const response = await fetch(`${apiUrl}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof,
          publicSignals,
          txid: txid || undefined,
          proofHash: proofHash || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'VERIFIED_AND_PAID':
        return 'text-green-600 bg-green-50 dark:bg-green-900';
      case 'VERIFIED_PENDING':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900';
      case 'PROOF_INVALID':
        return 'text-red-600 bg-red-50 dark:bg-red-900';
      case 'PAYMENT_NOT_FOUND':
        return 'text-red-600 bg-red-50 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900';
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-green-600 hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-8">Verify Proof & Payment</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Upload Proof Data</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Proof JSON
              </label>
              <textarea
                value={proofJson}
                onChange={(e) => setProofJson(e.target.value)}
                placeholder='{"pi_a": [...], "pi_b": [...], "pi_c": [...]}'
                className="w-full p-3 border rounded font-mono text-sm h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Public Signals JSON
              </label>
              <textarea
                value={publicSignalsJson}
                onChange={(e) => setPublicSignalsJson(e.target.value)}
                placeholder='["1"]'
                className="w-full p-3 border rounded font-mono text-sm h-24"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Transaction ID (optional)
                </label>
                <input
                  type="text"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  placeholder="64-character hex string"
                  className="w-full p-3 border rounded font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Proof Hash (optional)
                </label>
                <input
                  type="text"
                  value={proofHash}
                  onChange={(e) => setProofHash(e.target.value)}
                  placeholder="64-character hex string"
                  className="w-full p-3 border rounded font-mono text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900 rounded text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Proof & Payment'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Verification Results</h2>

            <div className={`p-6 rounded-lg mb-6 ${getStatusColor(result.combinedState)}`}>
              <div className="text-3xl font-bold mb-2">{result.combinedState}</div>
              <p className="text-sm opacity-80">
                {result.combinedState === 'VERIFIED_AND_PAID'
                  ? '✅ Proof is valid and payment is confirmed'
                  : result.combinedState === 'VERIFIED_PENDING'
                  ? '⚠️ Proof is valid but payment is pending confirmation'
                  : result.combinedState === 'PROOF_INVALID'
                  ? '❌ Proof verification failed'
                  : '❌ Payment not found'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  ZK Proof Valid
                </div>
                <div className="text-xl font-semibold">
                  {result.zkVerified ? '✅ Yes' : '❌ No'}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Payment Exists
                </div>
                <div className="text-xl font-semibold">
                  {result.paymentExists ? '✅ Yes' : '❌ No'}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Payment Confirmed
                </div>
                <div className="text-xl font-semibold">
                  {result.paymentConfirmed ? '✅ Yes' : '⏳ Pending'}
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Proof Hash Matches
                </div>
                <div className="text-xl font-semibold">
                  {result.proofHashMatches ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Privacy Note:</strong> This verification process does not reveal any
                personal information about the user. You only see the verification result
                and payment status.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

