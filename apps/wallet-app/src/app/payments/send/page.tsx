'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle2, Download, AlertCircle, ArrowLeft, Shield, Lock, ExternalLink, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useEthereum } from '@/providers/ethereum-provider';
import WalletConnect from '@/components/WalletConnect';
import StatusModal, { ModalStatus } from '@/components/StatusModal';
import PrivacyTooltip from '@/components/PrivacyTooltip';
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
import { sendPrivatePayment } from '@/lib/ethereum/payment';
import { 
  generateNonce, 
  generateCommitment, 
  storePaymentProof as storePrivacyProof,
  type PaymentProof as PrivacyPaymentProof 
} from '@/utils/privacy';
import {
  createPaymentProofFile,
  downloadPaymentProofFile,
  storePaymentProofFileRef,
  type PaymentProofFile,
} from '@/utils/proofFile';

// Contract address from environment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS || '';

export default function SendPayment() {
  const { address, isConnected, isCorrectNetwork, networkError, signer } = useEthereum();

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

  // Modal and proof file state
  const [modalStatus, setModalStatus] = useState<ModalStatus>(null);
  const [proofFile, setProofFile] = useState<PaymentProofFile | null>(null);
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const [currentCommitment, setCurrentCommitment] = useState<string | null>(null);

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

    // Check network before proceeding
    if (!isCorrectNetwork) {
      setError(networkError || 'Please switch your wallet to Ethereum Sepolia or Aztec Sepolia network');
      return;
    }

    if (!signer) {
      setError('Wallet signer not available. Please reconnect your wallet.');
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
    setModalStatus('sending');

    try {
      // Step 1: Generate random nonce for privacy
      const nonce = generateNonce();

      // Step 2: Convert amount to wei for commitment
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString();

      // Step 3: Generate commitment hash using Poseidon
      // commitment = poseidon_hash([sender, recipient, amount, nonce])
      const commitment = generateCommitment(address, recipient, amountWei, nonce);

      // Step 4: Send private payment through Ethereum/Aztec
      // Only the commitment is stored on-chain, not the actual details
      const result = await sendPrivatePayment({
        recipient,
        amount,
        commitment,
        signer,
      });

      // Step 5: Store privacy proof locally for later verification
      const privacyProof: PrivacyPaymentProof = {
        sender: address,
        recipient,
        amount: amountWei,
        nonce,
        commitment,
        timestamp: Date.now(),
      };
      storePrivacyProof(privacyProof);

      // Step 6: Create internal payment data (for local storage - PRIVATE)
      const internal = createInternalPaymentData({
        recipient,
        amount,
        proofType,
        proofHash: commitment,
      });
      
      // Override simulated tx hash with real Starknet tx hash
      (internal as any).txHash = result.txHash;
      (internal as any).commitment = commitment;
      (internal as any).nonce = nonce;
      (internal as any).blockNumber = result.blockNumber;
      setInternalData(internal);

      // Store internal data locally (for sender reference only)
      storeInternalPaymentData(internal);

      // Create privacy-preserving payment proof (for sharing with merchant)
      const proof = createPrivacyPreservingPaymentProof(internal, null);
      setPaymentProof(proof);

      // Store privacy-preserving proof
      storePaymentProof(proof);

      // Step 7: Generate Payment Proof File (identity proof + commitment + nonce)
      const paymentProofFile = createPaymentProofFile(commitment, nonce, proofType);
      setProofFile(paymentProofFile);
      
      // Store proof file reference
      storePaymentProofFileRef(paymentProofFile);

      // Store tx hash and commitment for modal display
      setCurrentTxHash(result.txHash);
      setCurrentCommitment(commitment);

      // Auto-download the proof file
      downloadPaymentProofFile(paymentProofFile);

      setSent(true);

      // Show success modal
      setModalStatus('success');
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to send payment');
      setModalStatus('error');
    } finally {
      setSending(false);
    }
  };

  const handleDownload = () => {
    if (proofFile) {
      downloadPaymentProofFile(proofFile);
    } else if (paymentProof) {
      downloadPaymentProof(paymentProof);
    }
  };

  const handleCloseModal = () => {
    setModalStatus(null);
  };

  // Filter proofs by type
  const ageProofs = availableProofs.filter((p) => p.circuitType === 'age18');
  const nationalityProofs = availableProofs.filter((p) => p.circuitType === 'country');
  const uniquenessProofs = availableProofs.filter((p) => p.circuitType === 'uniqueness');

  return (
    <>
      {/* Status Modal */}
      <StatusModal
        status={modalStatus}
        onClose={handleCloseModal}
        txHash={currentTxHash || undefined}
        contractAddress={CONTRACT_ADDRESS || undefined}
        errorMessage={error || undefined}
        autoCloseDelay={modalStatus === 'success' ? 0 : 0}
      />

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

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">Send Private Payment</h1>

        {!isConnected && (
          <div className="mb-4 sm:mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-yellow-300 mb-1 sm:mb-2">Connect your wallet to send payments</p>
              </div>
              <div className="flex-shrink-0">
                <WalletConnect />
              </div>
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
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 border-2 border-green-500/30 rounded-xl p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 border border-green-500/40">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-green-400 mb-1">
                ✅ PRIVATE PAYMENT SUCCESSFUL
              </h2>
              <p className="text-sm text-green-300/80">
                Your transaction has been confirmed on Ethereum Sepolia
              </p>
            </div>

            {/* Transaction Details with StarkScan Links */}
            <div className="bg-neutral-800/40 rounded-xl p-4 space-y-3 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Transaction Details</p>
                <PrivacyTooltip type="hidden" position="left" />
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-xs text-gray-400">Recipient</p>
                <p className="text-xs text-white font-mono">{internalData.recipient.substring(0, 10)}...{internalData.recipient.slice(-6)}</p>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-xs text-gray-400">Amount</p>
                <p className="text-sm text-white font-semibold">{internalData.amount} ETH</p>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-xs text-gray-400">Transaction Hash</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${internalData.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-blue-400 font-mono hover:text-blue-300 transition-colors"
                >
                  <span>{internalData.txHash.substring(0, 12)}...</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              
              {CONTRACT_ADDRESS && (
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <p className="text-xs text-gray-400">Contract Address</p>
                  <a
                    href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs text-blue-400 font-mono hover:text-blue-300 transition-colors"
                  >
                    <span>{CONTRACT_ADDRESS.substring(0, 12)}...</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {internalData.commitment && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-1">
                    <p className="text-xs text-gray-400">Commitment Hash</p>
                    <PrivacyTooltip type="commitment" iconSize="sm" position="top" />
                  </div>
                  <p className="text-xs text-purple-400 font-mono">{internalData.commitment.substring(0, 16)}...</p>
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href="/payments"
                className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors text-center touch-manipulation min-h-[44px] flex items-center justify-center"
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
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-colors touch-manipulation min-h-[44px]"
              >
                Send Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recipient Address */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono transition-all"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Attach ZK Identity Proof */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <label className="text-xs sm:text-sm font-medium text-gray-300">
                  Attach ZK Identity Proof (Optional)
                </label>
                <PrivacyTooltip type="zkproof" iconSize="sm" position="top" />
              </div>
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
              {proofType && (
                <p className="mt-1 text-xs text-gray-400">
                  Selected proof type: <span className="text-blue-400 capitalize">{proofType}</span>
                </p>
              )}
            </div>

            {/* Proof Hash (Auto-filled) */}
            {proofHash && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Proof Hash (Auto-filled)</label>
                <input
                  type="text"
                  value={proofHash}
                  readOnly
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-gray-400 font-mono cursor-not-allowed break-all min-h-[44px]"
                />
                <p className="mt-1 text-xs text-gray-400 break-words">
                  This hash is calculated using keccak256(proof.type + proof.output)
                </p>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendPayment}
              disabled={sending || !isConnected || !recipient || !amount}
              className={`w-full rounded-xl px-6 py-4 text-sm font-bold text-white transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg ${
                sending || !isConnected || !recipient || !amount
                  ? 'bg-gray-600 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/25 hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Processing Transaction...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>SEND PRIVATE PAYMENT</span>
                  <Lock className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Privacy Notices */}
            <div className="grid gap-3">
              {/* Commitment Hash Info */}
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-semibold text-purple-300">🔒 Privacy Protected</p>
                      <PrivacyTooltip type="commitment" iconSize="sm" position="top" />
                    </div>
                    <p className="text-xs text-purple-200/80 leading-relaxed">
                      Your transaction uses a <strong>commitment hash</strong>. The blockchain only stores a cryptographic hash — never your actual payment details.
                    </p>
                  </div>
                </div>
              </div>

              {/* ZK Proof Info */}
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-semibold text-blue-300">Privacy-First Payments</p>
                      <PrivacyTooltip type="privacy" iconSize="sm" position="top" />
                    </div>
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                      The payment-proof.json file contains NO sensitive data — no wallet addresses, amounts, or timestamps. Only privacy-preserving signals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Note */}
            <div className="text-center py-2">
              <p className="text-xs text-gray-500">
                Payments are sent on <span className="text-gray-400">Ethereum Sepolia Testnet</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
