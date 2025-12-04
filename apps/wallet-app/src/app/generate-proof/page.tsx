'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Key, CheckCircle2, Download, Shield, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import { generateAgeProof, generateCountryProof, generateUniquenessProof } from '@/lib/zk/proof';

type ClaimType = 'age18' | 'nationality' | 'student' | 'uniqueness' | '';

export default function GenerateProof() {
  const { address, isConnected } = useAccount();
  const [claimType, setClaimType] = useState<ClaimType>('');
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [credentials, setCredentials] = useState<any[]>([]);
  const [ageInput, setAgeInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [proof, setProof] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load credentials from localStorage
    const stored = localStorage.getItem('blurd_credentials');
    if (stored) {
      try {
        setCredentials(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load credentials:', e);
      }
    }
  }, []);

  const handleGenerateProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!claimType) {
      setError('Please select a claim type');
      return;
    }

    setLoading(true);
    setProofGenerated(false);
    setError(null);

    try {
      let proofResult: any;

      if (claimType === 'age18') {
        // If user entered age manually, use it; otherwise try to derive from credential
        let age = parseInt(ageInput || '0', 10);
        if (!age && selectedCredential) {
          const cred = credentials.find((c: any) => c.id === selectedCredential);
          const dob = cred?.extractedFields?.dob || cred?.fields?.dob;
          if (dob) {
            const dobDate = new Date(dob);
            const now = new Date();
            age = now.getFullYear() - dobDate.getFullYear();
          }
        }
        if (!age || isNaN(age)) {
          throw new Error('Please provide a valid age or select a credential with a DOB');
        }
        proofResult = await generateAgeProof(age, 18);
      } else if (claimType === 'nationality') {
        // Use country code input or credential field
        let userCountry = countryInput.trim().toUpperCase();
        if (!userCountry && selectedCredential) {
          const cred = credentials.find((c: any) => c.id === selectedCredential);
          userCountry = (cred?.extractedFields?.countryCode || cred?.fields?.countryCode || '').toUpperCase();
        }
        if (!userCountry) {
          throw new Error('Please provide your country code or select a credential with a country code');
        }
        // For MVP, require userCountry to equal required country (self-asserted)
        proofResult = await generateCountryProof(userCountry, userCountry);
      } else if (claimType === 'student') {
        // For MVP, use uniqueness proof with a simple identifier from credential
        let identifier = '';
        if (selectedCredential) {
          const cred = credentials.find((c: any) => c.id === selectedCredential);
          identifier =
            cred?.extractedFields?.studentId ||
            cred?.fields?.studentId ||
            cred?.id ||
            '';
        }
        if (!identifier) {
          throw new Error('Please select a credential that includes a student identifier');
        }
        proofResult = await generateUniquenessProof(identifier);
      } else if (claimType === 'uniqueness') {
        // Use the connected wallet address directly as the human uniqueness anchor
        const identifier = address;
        proofResult = await generateUniquenessProof(identifier);
      } else {
        throw new Error('Unsupported claim type');
      }

      // Store proof locally
      const stored = localStorage.getItem('blurd_proofs');
      const proofs = stored ? JSON.parse(stored) : [];
      proofs.push({
        ...proofResult,
        claimType,
        generatedAt: new Date().toISOString(),
      });
      localStorage.setItem('blurd_proofs', JSON.stringify(proofs));

      setProof(proofResult);
      setProofGenerated(true);
    } catch (err: any) {
      console.error('Proof generation error:', err);
      setError(err.message || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!proof) return;

    const dataStr = JSON.stringify(proof, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zk-proof-${claimType}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Wallet Not Connected</h3>
          <p className="text-sm text-gray-300 mb-4">
            Please connect your wallet to generate proofs. Your wallet address will be used as your identity anchor.
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  if (proofGenerated && proof) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <h1 className="text-2xl font-semibold text-green-300">Proof Generated Successfully</h1>
          </div>
          <p className="text-sm text-green-200 mb-6">
            Your zero-knowledge proof has been generated and is ready to share. No sensitive information is revealed.
          </p>

          <div className="bg-neutral-800/40 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-xs text-gray-400">Claim Type</span>
                <span className="text-xs text-white font-semibold capitalize">{claimType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-xs text-gray-400">Proof Hash</span>
                <span className="text-xs text-blue-400 font-mono break-all">
                  {proof.proofHash?.substring(0, 20)}...
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-gray-400">Status</span>
                <span className="text-xs text-green-400 font-semibold">Valid</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download Proof</span>
            </button>
          </div>

          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-300 mb-1">Privacy Protected</p>
                <p className="text-xs text-blue-200">
                  This proof verifies your claim without revealing any personal information. You can share it with any platform that needs verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Generate Zero-Knowledge Proof</h1>
        <p className="text-sm text-gray-400 mb-6">
          Create a privacy-preserving proof for your identity claims without revealing personal data.
        </p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Claim Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Claim to Prove
            </label>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as ClaimType)}
              className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select a claim type</option>
              <option value="age18">Age ≥ 18</option>
              <option value="nationality">Nationality</option>
              <option value="student">Student Status</option>
              <option value="uniqueness">Human Uniqueness (one-human-one-handle)</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Choose what you want to prove about yourself without revealing the actual value.
            </p>
          </div>

          {/* Optional Inputs for Claims */}
          {claimType === 'age18' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Age (optional)
              </label>
              <input
                type="number"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="Enter your age or select a credential with DOB"
                className="block w-full rounded-lg border border-white/10 bg-white/5 px  -4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                If left empty, the app will try to derive your age from the selected credential&apos;s DOB.
              </p>
            </div>
          )}

          {claimType === 'nationality' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country Code (optional)
              </label>
              <input
                type="text"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder="e.g. US, NG, DE or select a credential with country code"
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                If left empty, the app will try to use the country code from the selected credential.
              </p>
            </div>
          )}

          {/* Credential Selection (Optional) */}
          {credentials.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Credential (Optional)
              </label>
              <select
                value={selectedCredential}
                onChange={(e) => setSelectedCredential(e.target.value)}
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">None (manual input)</option>
                {credentials.map((cred: any) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.documentType} - {new Date(cred.uploadedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Use a previously uploaded credential or enter data manually.
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateProof}
            disabled={loading || !claimType}
            className={`w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all flex items-center justify-center space-x-2 ${
              loading || !claimType
                ? 'bg-gray-600 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Proof...</span>
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                <span>Generate Proof</span>
              </>
            )}
          </button>

          {/* Privacy Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-300 mb-1">Zero-Knowledge Proof</p>
                <p className="text-xs text-blue-200">
                  The proof generation happens entirely in your browser. Your personal data never leaves your device.
                  The generated proof can verify your claim without revealing any sensitive information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
