'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle2, Download, AlertCircle, ArrowLeft, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { loadStoredProofs, ProofResult } from '@/lib/zk/proof';
import {
  createInternalPaymentData,
  createPrivacyPreservingPaymentProof,
  calculateProofHash,
  downloadPaymentProof,
  storeInternalPaymentData,
  storePaymentProof,
  type PrivacyPreservingPaymentProof,
  type ProofBinding,
} from '@/lib/payment-proof';

export default function SendPayment() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [proofType, setProofType] = useState<'age' | 'nationality' | 'uniqueness' | null>(null);
  const [proofHash, setProofHash] = useState<string | null>(null);
  const [availableProofs, setAvailableProofs] = useState<ProofResult[]>([]);

  // Submission state
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [paymentProof, setPaymentProof] = useState<PrivacyPreservingPaymentProof | null>(null);
  const [internalData, setInternalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available proofs on mount
  useEffect(() => {
    const proofs = loadStoredProofs();
    setAvailableProofs(proofs);
  }, []);

  // Auto-fill proof hash when proof type is selected
  useEffect(() => {
    if (proofType && availableProofs.length > 0) {
      // Map payment proof type to circuit type
      const circuitTypeMap: Record<string, string> = {
        age: 'age18',
        nationality: 'country',
        uniqueness: 'uniqueness',
      };
      const circuitType = circuitTypeMap[proofType];

      // Find proof matching the selected type
      const matchingProof = availableProofs.find((p) => p.circuitType === circuitType);

      if (matchingProof) {
        // Calculate proof hash using keccak256(proof.type + proof.output)
        // Use the first public signal as output, or merkleRoot for uniqueness, or proofHash as fallback
        const output = matchingProof.publicSignals?.[0] || matchingProof.merkleRoot || matchingProof.proofHash;
        if (output) {
          const binding: ProofBinding = {
            type: proofType,
            output: output,
          };
          const hash = calculateProofHash(binding);
          setProofHash(hash);
        }
      } else {
        setProofHash(null);
      }
    } else {
      setProofHash(null);
    }
  }, [proofType, availableProofs]);

  const handleSendPayment = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!recipient || !amount) {
      setError('Please enter recipient address and amount');
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Create internal payment data (for local storage - PRIVATE)
      const internal = createInternalPaymentData({
        recipient,
        amount,
        proofType,
        proofHash,
      });
      setInternalData(internal);

      // Store internal data locally (for sender reference only)
      storeInternalPaymentData(internal);

      // Create privacy-preserving payment proof (for sharing with merchant)
      const proof = createPrivacyPreservingPaymentProof(internal, null);
      setPaymentProof(proof);

      // Store privacy-preserving proof
      storePaymentProof(proof);

      // Also store in legacy payment format for compatibility (internal only)
      const stored = localStorage.getItem('blurd_payments');
      const payments = stored ? JSON.parse(stored) : [];
      payments.push({
        txid: internal.txHash,
        toAddress: recipient,
        amount: amountNum,
        proofHash: proofHash || null,
        timestamp: new Date().toISOString(),
        confirmed: false,
      });
      localStorage.setItem('blurd_payments', JSON.stringify(payments));

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send payment');
    } finally {
      setSending(false);
    }
  };

  const handleDownload = () => {
    if (paymentProof) {
      downloadPaymentProof(paymentProof);
    }
  };

  // Filter proofs by type
  const ageProofs = availableProofs.filter((p) => p.circuitType === 'age18');
  const nationalityProofs = availableProofs.filter((p) => p.circuitType === 'country');
  const uniquenessProofs = availableProofs.filter((p) => p.circuitType === 'uniqueness');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/payments"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Link>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Send Private Payment</h1>
        <p className="text-sm text-gray-400 mb-6">
          Send a private payment and optionally bind it to a ZK identity proof
        </p>

        {!isConnected && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300 mb-2">Connect your wallet to send payments</p>
              </div>
              <ConnectButton />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {sent && paymentProof && internalData ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-300">Your private payment has been processed!</p>
            </div>

            {/* Internal Payment Details (for sender reference only) */}
            <div className="bg-neutral-800/40 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-300 mb-2">Your Payment Details (Private):</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Recipient:</p>
                <p className="text-xs text-white font-mono">{internalData.recipient.substring(0, 10)}...{internalData.recipient.slice(-6)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Amount:</p>
                <p className="text-xs text-white font-semibold">{internalData.amount} MATIC</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Transaction Hash:</p>
                <p className="text-xs text-blue-400 font-mono">{internalData.txHash.substring(0, 16)}...</p>
              </div>
              {internalData.proofHash && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Proof Hash:</p>
                  <p className="text-xs text-purple-400 font-mono">{internalData.proofHash.substring(0, 16)}...</p>
                </div>
              )}
              {internalData.proofType && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Proof Type:</p>
                  <p className="text-xs text-blue-400 capitalize">{internalData.proofType}</p>
                </div>
              )}
            </div>

            {/* Privacy-Preserving Proof Download */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <Lock className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-300 mb-1">
                    Download your payment-proof.json (Privacy-Preserving)
                  </p>
                  <p className="text-xs text-blue-300 mb-4">
                    This file contains NO sensitive data (no wallet addresses, transaction hashes, or timestamps).
                    Share this with the merchant for verification.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download payment-proof.json</span>
              </button>
            </div>

            {/* Privacy Summary */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-300 mb-1">Privacy Protection</p>
                  <p className="text-xs text-green-300">
                    The payment-proof.json file you download will NOT contain your wallet address, transaction hash, or timestamp.
                    Only privacy-preserving validation signals are included.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Link
                href="/payments"
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors text-center"
              >
                Back to Payments
              </Link>
              <button
                onClick={() => {
                  setSent(false);
                  setPaymentProof(null);
                  setInternalData(null);
                  setRecipient('');
                  setAmount('');
                  setProofType(null);
                  setProofHash(null);
                  setError(null);
                }}
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Send Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (MATIC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Attach ZK Identity Proof */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attach ZK Identity Proof (Optional)
              </label>
              <select
                value={proofType || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setProofType(value ? (value as 'age' | 'nationality' | 'uniqueness') : null);
                }}
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">None</option>
                <option value="age" disabled={ageProofs.length === 0}>
                  Age 18+ {ageProofs.length === 0 && '(No proof available)'}
                </option>
                <option value="nationality" disabled={nationalityProofs.length === 0}>
                  Nationality {nationalityProofs.length === 0 && '(No proof available)'}
                </option>
                <option value="uniqueness" disabled={uniquenessProofs.length === 0}>
                  Human Uniqueness {uniquenessProofs.length === 0 && '(No proof available)'}
                </option>
              </select>
              {proofType && (
                <p className="mt-1 text-xs text-gray-400">
                  Selected proof type: <span className="text-blue-400 capitalize">{proofType}</span>
                </p>
              )}
            </div>

            {/* Proof Hash (Auto-filled) */}
            {proofHash && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Proof Hash (Auto-filled)</label>
                <input
                  type="text"
                  value={proofHash}
                  readOnly
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-400 font-mono cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-400">
                  This hash is calculated using keccak256(proof.type + proof.output)
                </p>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendPayment}
              disabled={sending || !isConnected || !recipient || !amount}
              className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
                sending || !isConnected || !recipient || !amount
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Processing...' : 'SEND PRIVATE PAYMENT'}</span>
            </button>

            {/* Privacy Note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Lock className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-300 mb-1">Privacy-First Payments</p>
                  <p className="text-xs text-blue-300">
                    The payment-proof.json file generated will NOT contain sensitive data (wallet addresses, transaction hashes, timestamps).
                    Only privacy-preserving validation signals are included.
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
              <p className="text-xs text-gray-300">
                <strong>Note:</strong> In MVP mode, Blurd simulates shielded Zcash-like payments locally.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
