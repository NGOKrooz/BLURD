'use client';

import { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft, FileText, Key, XCircle, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import {
  verifyPaymentProof,
  verifyPaymentProofStructure,
  isOldProofFormat,
  type PrivacyPreservingPaymentProof,
} from '@/lib/payment-proof';

export default function VerifyPayment() {
  // Form state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [requiredAmount, setRequiredAmount] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    paymentVerified: boolean;
    amountValid: boolean;
    signatureValid: boolean;
    proofHashValid: boolean;
    timestampValid: boolean;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<PrivacyPreservingPaymentProof | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
    setError(null);
    setVerificationResult(null);
    setPaymentProof(null);
  };

  const handleVerify = async () => {
    if (!proofFile) {
      setError('Please upload a payment-proof.json file');
      return;
    }

    setVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      // Read file content
      const fileContent = await proofFile.text();
      let proof: any;

      try {
        proof = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON file. Please upload a valid payment-proof.json file.');
      }

      // Check for old proof format (privacy violation - reject immediately)
      if (isOldProofFormat(proof)) {
        throw new Error(
          'This proof uses an old, privacy-violating format. ' +
          'Old proofs contain sensitive data (wallet addresses, transaction hashes, timestamps) and cannot be verified. ' +
          'Please request a new payment-proof.json from the sender that uses the privacy-preserving format.'
        );
      }

      // Validate structure first
      const structureCheck = verifyPaymentProofStructure(proof);
      if (!structureCheck.valid) {
        throw new Error(`Invalid payment proof structure: ${structureCheck.errors.join(', ')}`);
      }

      setPaymentProof(proof as PrivacyPreservingPaymentProof);

      // Verify payment proof
      const requiredAmountNum = requiredAmount ? parseFloat(requiredAmount) : undefined;
      if (requiredAmount && (isNaN(requiredAmountNum!) || requiredAmountNum! <= 0)) {
        throw new Error('Please enter a valid required amount');
      }

      const result = verifyPaymentProof(proof as PrivacyPreservingPaymentProof, requiredAmountNum);
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

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
        <h1 className="text-2xl font-semibold text-white mb-2">Verify Incoming Payment</h1>
        <p className="text-sm text-gray-400 mb-6">
          Upload a privacy-preserving payment-proof.json file to verify a payment without exposing sensitive data
        </p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300 mb-1">Verification Failed</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {verificationResult && paymentProof && (
          <div className="mb-6">
            {verificationResult.paymentVerified ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-4">
                {/* Success Header */}
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  <h2 className="text-lg font-semibold text-green-300">Payment Proof is Valid</h2>
                </div>

                {/* Payment Integrity Section */}
                <div className="bg-neutral-800/40 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Payment Integrity:</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Signature Valid:</p>
                      <span className={`text-xs font-semibold ${verificationResult.signatureValid ? 'text-green-400' : 'text-red-400'}`}>
                        {verificationResult.signatureValid ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Timestamp Valid:</p>
                      <span className={`text-xs font-semibold ${verificationResult.timestampValid ? 'text-green-400' : 'text-red-400'}`}>
                        {verificationResult.timestampValid ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Proof Hash Valid:</p>
                      <span className={`text-xs font-semibold ${verificationResult.proofHashValid ? 'text-green-400' : 'text-red-400'}`}>
                        {verificationResult.proofHashValid ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Amount Check:</p>
                      <span className={`text-xs font-semibold ${verificationResult.amountValid ? 'text-green-400' : 'text-red-400'}`}>
                        {verificationResult.amountValid
                          ? (paymentProof.publicMetadata.requiredAmount
                              ? `Matches Requirement (YES)`
                              : 'No Requirement (YES)')
                          : 'Mismatch (NO)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Identity Binding Section */}
                {paymentProof.zkProofHash && (
                  <div className="bg-neutral-800/40 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Identity Binding:</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Linked ZK Identity Proof:</p>
                      <span className="text-xs font-semibold text-green-400">VALID</span>
                    </div>
                  </div>
                )}

                {/* Privacy Summary */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Lock className="h-4 w-4 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-300 mb-1">Privacy Summary</p>
                      <p className="text-xs text-blue-300">
                        No wallet addresses, transaction hashes, or personal user data were revealed during verification.
                        Only zero-knowledge validation signals are shown.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <XCircle className="h-6 w-6 text-red-400" />
                  <h2 className="text-lg font-semibold text-red-300">Verification Failed</h2>
                </div>
                {verificationResult.error && (
                  <p className="text-sm text-red-300 mb-4">{verificationResult.error}</p>
                )}

                {/* Error Details */}
                <div className="bg-neutral-800/40 rounded-lg p-4 space-y-2">
                  {!verificationResult.amountValid && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-red-300">Amount verification failed or mismatch</p>
                    </div>
                  )}
                  {!verificationResult.signatureValid && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-red-300">Invalid signature</p>
                    </div>
                  )}
                  {!verificationResult.timestampValid && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-red-300">Timestamp expired (proof must be within 24 hours)</p>
                    </div>
                  )}
                  {!verificationResult.proofHashValid && (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-red-300">Invalid proof hash format</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Upload File */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload payment-proof.json
            </label>
            <div className="border border-white/10 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="payment-proof-file"
              />
              <label
                htmlFor="payment-proof-file"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {proofFile ? proofFile.name : 'Click to upload payment-proof.json'}
                </span>
              </label>
            </div>
            {proofFile && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400">
                <FileText className="h-4 w-4" />
                <span>{proofFile.name}</span>
              </div>
            )}
          </div>

          {/* Required Amount (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Required Amount (Optional)
            </label>
            <input
              type="number"
              value={requiredAmount}
              onChange={(e) => setRequiredAmount(e.target.value)}
              placeholder="0.00"
              step="0.0001"
              min="0"
              className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              Leave empty to verify any amount. If specified, the payment proof&apos;s requiredAmount must match exactly.
            </p>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={verifying || !proofFile}
            className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
              verifying || !proofFile
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>{verifying ? 'Verifying...' : 'VERIFY PAYMENT'}</span>
          </button>

          {/* Privacy Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-300 mb-1">Privacy-First Verification</p>
                <p className="text-xs text-blue-300">
                  Blurd uses privacy-preserving verification. No wallet addresses, transaction hashes, or personal user data is displayed.
                  Only zero-knowledge validation signals are shown.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Another Button (after verification) */}
        {verificationResult && (
          <div className="mt-6">
            <button
              onClick={() => {
                setProofFile(null);
                setRequiredAmount('');
                setVerificationResult(null);
                setPaymentProof(null);
                setError(null);
              }}
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Upload Another Proof
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
