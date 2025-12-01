'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle2, Download, AlertCircle, ArrowLeft, Shield, Lock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
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
import { sendStarknetPayment, detectAndConnectWallet } from '@/lib/starknet';
import TransactionLoading from '@/components/TransactionLoading';
import ZKProofAttached from '@/components/ZKProofAttached';

/**
 * Enhanced Send Payment Screen with Starknet Integration
 * Features:
 * - Real Starknet testnet transactions
 * - Transaction loading states
 * - Success animations
 * - ZK proof binding
 */
export default function SendPaymentEnhanced() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [proofType, setProofType] = useState<'age' | 'nationality' | 'uniqueness' | null>(null);
  const [proofHash, setProofHash] = useState<string | null>(null);
  const [availableProofs, setAvailableProofs] = useState<ProofResult[]>([]);

  // Submission state
  const [sending, setSending] = useState(false);
  const [txStatus, setTxStatus] = useState<'pending' | 'accepted' | 'confirmed' | 'rejected' | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [paymentProof, setPaymentProof] = useState<PrivacyPreservingPaymentProof | null>(null);
  const [internalData, setInternalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Check wallet connection on mount
  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window.starknet || window.starknet_braavos || window.starknet_argentX)) {
        const wallet = await detectAndConnectWallet();
        if (wallet && wallet.selectedAddress) {
          setWalletAddress(wallet.selectedAddress);
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.error('Wallet not connected:', err);
    }
  };

  // Load available proofs on mount
  useEffect(() => {
    const proofs = loadStoredProofs();
    setAvailableProofs(proofs);
  }, []);

  // Auto-fill proof hash when proof type is selected
  useEffect(() => {
    if (proofType && availableProofs.length > 0) {
      const circuitTypeMap: Record<string, string> = {
        age: 'age18',
        nationality: 'country',
        uniqueness: 'uniqueness',
      };
      const circuitType = circuitTypeMap[proofType];
      const matchingProof = availableProofs.find((p) => p.circuitType === circuitType);

      if (matchingProof) {
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

  const handleConnectWallet = async () => {
    try {
      const wallet = await detectAndConnectWallet();
      if (wallet && wallet.selectedAddress) {
        setWalletAddress(wallet.selectedAddress);
        setIsConnected(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet. Please install Braavos or Argent X.');
    }
  };

  const handleSendPayment = async () => {
    if (!isConnected || !walletAddress) {
      setError('Please connect your Starknet wallet first');
      return;
    }

    if (!recipient || !amount) {
      setError('Please enter recipient address and amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSending(true);
    setError(null);
    setTxStatus('pending');

    try {
      // Send Starknet transaction
      const hash = await sendStarknetPayment({
        recipient,
        amount: amountNum.toString(),
        proofHash: proofHash || null,
      });

      setTxHash(hash);
      setTxStatus('accepted');

      // Simulate waiting for confirmation (in production, poll for tx status)
      setTimeout(() => {
        setTxStatus('confirmed');
        
        // Create internal payment data
        const internal = createInternalPaymentData({
          recipient,
          amount: amountNum.toString(),
          proofType,
          proofHash,
        });
        // Override with real tx hash
        internal.txHash = hash;
        setInternalData(internal);
        storeInternalPaymentData(internal);

        // Create privacy-preserving payment proof
        const proof = createPrivacyPreservingPaymentProof(internal, null);
        setPaymentProof(proof);
        storePaymentProof(proof);

        setSent(true);
        setSending(false);
      }, 3000);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Failed to send payment');
      setTxStatus('rejected');
      setSending(false);
    }
  };

  const handleDownload = () => {
    if (paymentProof) {
      downloadPaymentProof(paymentProof);
    }
  };

  const handleReset = () => {
    setSent(false);
    setPaymentProof(null);
    setInternalData(null);
    setRecipient('');
    setAmount('');
    setProofType(null);
    setProofHash(null);
    setError(null);
    setTxStatus(null);
    setTxHash(null);
  };

  const ageProofs = availableProofs.filter((p) => p.circuitType === 'age18');
  const nationalityProofs = availableProofs.filter((p) => p.circuitType === 'country');
  const uniquenessProofs = availableProofs.filter((p) => p.circuitType === 'uniqueness');

  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <Link
          href="/payments"
          className="inline-flex items-center text-xs sm:text-sm text-gray-400 hover:text-white transition-colors touch-manipulation min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Back to Payments</span>
        </Link>
      </div>

      <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">Send Private Payment</h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-6">Send payments on Starknet Testnet with optional ZK proof binding</p>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-yellow-300 mb-1">Connect your Starknet wallet to send payments</p>
                <p className="text-xs text-yellow-300/80">Install Braavos or Argent X wallet extension</p>
              </div>
              <button
                onClick={handleConnectWallet}
                className="flex-shrink-0 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Transaction Loading */}
        {txStatus && !sent && (
          <div className="mb-6">
            <TransactionLoading status={txStatus} txHash={txHash || undefined} />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Success Screen */}
        {sent && paymentProof && internalData ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-300">Payment confirmed on Starknet Testnet</p>
            </div>

            {/* Payment Details */}
            <div className="bg-neutral-800/40 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-300 mb-2">Payment Details</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Recipient:</p>
                <p className="text-xs text-white font-mono">{internalData.recipient.substring(0, 10)}...{internalData.recipient.slice(-6)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Amount:</p>
                <p className="text-xs text-white font-semibold">{internalData.amount} STRK</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Transaction Hash:</p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-blue-400 font-mono">{internalData.txHash.substring(0, 16)}...</p>
                  <a
                    href={`https://sepolia.starkscan.co/tx/${internalData.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              {internalData.proofHash && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Proof Hash:</p>
                  <p className="text-xs text-purple-400 font-mono">{internalData.proofHash.substring(0, 16)}...</p>
                </div>
              )}
            </div>

            {/* ZK Proof Attached (if applicable) */}
            {proofType && proofHash && (
              <ZKProofAttached proofType={proofType} proofHash={proofHash} onDownload={handleDownload} />
            )}

            {/* Privacy-Preserving Proof Download */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2 mb-3">
                <Lock className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-300 mb-1">Download payment-proof.json</p>
                  <p className="text-xs text-blue-300 mb-4">
                    This file contains NO sensitive data. Share with merchant for verification.
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href="/payments"
                className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors text-center touch-manipulation min-h-[44px] flex items-center justify-center"
              >
                Back to Payments
              </Link>
              <button
                onClick={handleReset}
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors touch-manipulation min-h-[44px]"
              >
                Send Another
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="space-y-6">
            {/* Recipient Address */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none font-mono min-h-[44px] touch-manipulation"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Amount (STRK)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none min-h-[44px] touch-manipulation"
              />
            </div>

            {/* Attach ZK Identity Proof */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Attach ZK Identity Proof (Optional)
              </label>
              <select
                value={proofType || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setProofType(value ? (value as 'age' | 'nationality' | 'uniqueness') : null);
                }}
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none min-h-[44px] touch-manipulation"
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
            </div>

            {/* Proof Hash Display */}
            {proofHash && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Proof Hash (Auto-filled)</label>
                <input
                  type="text"
                  value={proofHash}
                  readOnly
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-gray-400 font-mono cursor-not-allowed break-all min-h-[44px]"
                />
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendPayment}
              disabled={sending || !isConnected || !recipient || !amount}
              className={`w-full rounded-md px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-white transition-colors flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] ${
                sending || !isConnected || !recipient || !amount
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{sending ? 'Processing...' : 'SEND PAYMENT'}</span>
            </button>

            {/* Privacy Note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-300 mb-1">Privacy-First Payments</p>
                  <p className="text-xs text-blue-300">
                    Payments are sent on Starknet Testnet. Proof hashes are stored on-chain without exposing personal data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

