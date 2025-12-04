'use client';

import { useState } from 'react';
import { Download, Shield, CheckCircle2, AlertCircle, User, Calendar, Globe } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import WalletConnect from '@/components/WalletConnect';
import { generateAgeProof, generateUniquenessProof, generateCountryProof, downloadProof, storeProof } from '@/lib/zk/proof';

type ProofType = 'age18' | 'uniqueness' | 'country' | null;

export default function GenerateIdentityProof() {
  const { address, isConnected } = useAccount();
  const [proofType, setProofType] = useState<ProofType>(null);
  const [userAge, setUserAge] = useState('');
  const [userCountryCode, setUserCountryCode] = useState('');
  const [requiredCountryCode, setRequiredCountryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAgeProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    // Validate and parse age properly - ensure it's a valid number
    const ageStr = String(userAge).trim();
    if (!ageStr || ageStr === '') {
      setError('Please enter your age');
      return;
    }
    
    const age = parseInt(ageStr, 10);
    if (isNaN(age) || age < 0 || age > 150) {
      setError('Please enter a valid age (0-150)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure we pass a number, not a string or array
      const result = await generateAgeProof(age, 18);
      setProof(result);
      storeProof(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCountryProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    // Validate country codes
    const userCountry = userCountryCode.trim().toUpperCase();
    const requiredCountry = requiredCountryCode.trim().toUpperCase();

    if (!userCountry || userCountry.length === 0) {
      setError('Please enter your country code (e.g., US, UK, NG)');
      return;
    }

    if (!requiredCountry || requiredCountry.length === 0) {
      setError('Please enter the required country code');
      return;
    }

    if (userCountry.length !== 2 && userCountry.length !== 3) {
      setError('Country code must be 2 or 3 characters (e.g., US, NGA)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateCountryProof(userCountry, requiredCountry);
      setProof(result);
      storeProof(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUniquenessProof = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateUniquenessProof(address);
      setProof(result);
      storeProof(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (proof) {
      downloadProof(proof);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-white">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Generate Identity Proof</h1>
        <p className="text-sm text-gray-400 mb-6">
          Create zero-knowledge proofs for age verification, nationality, or human uniqueness
        </p>

        {!isConnected && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300 mb-2">Connect your wallet to generate proofs</p>
              </div>
              <WalletConnect />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {proof ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-300">Proof generated successfully</p>
            </div>

            <div className="bg-neutral-800/40 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Proof Hash:</p>
              <p className="text-xs text-blue-400 font-mono break-all">{proof.proofHash}</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download proof.json</span>
              </button>
              <button
                onClick={() => {
                  setProof(null);
                  setProofType(null);
                  setUserAge('');
                  setUserCountryCode('');
                  setRequiredCountryCode('');
                }}
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Generate Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Select Proof Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setProofType('age18')}
                  className={`p-6 rounded-lg border transition-colors text-left ${
                    proofType === 'age18'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <span className="font-semibold text-white">Age</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Prove you are 18 or older without revealing your exact age
                  </p>
                </button>

                <button
                  onClick={() => setProofType('country')}
                  className={`p-6 rounded-lg border transition-colors text-left ${
                    proofType === 'country'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Globe className="h-5 w-5 text-green-400" />
                    <span className="font-semibold text-white">Nationality</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Prove you are from a specific country without revealing other details
                  </p>
                </button>

                <button
                  onClick={() => setProofType('uniqueness')}
                  className={`p-6 rounded-lg border transition-colors text-left ${
                    proofType === 'uniqueness'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="h-5 w-5 text-purple-400" />
                    <span className="font-semibold text-white">Uniqueness</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Generate a unique proof bound to your wallet address
                  </p>
                </button>
              </div>
            </div>

            {proofType === 'age18' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Age
                </label>
                <input
                  type="number"
                  value={userAge}
                  onChange={(e) => setUserAge(e.target.value)}
                  placeholder="Enter your age"
                  min="0"
                  max="150"
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Your age will remain private. Only the verification result (≥18) will be public.
                </p>
                <button
                  onClick={handleGenerateAgeProof}
                  disabled={loading || !userAge}
                  className={`mt-4 w-full rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
                    loading || !userAge
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>{loading ? 'Generating Proof...' : 'Generate Age Proof'}</span>
                </button>
              </div>
            )}

            {proofType === 'country' && (
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Country Code
                    </label>
                    <input
                      type="text"
                      value={userCountryCode}
                      onChange={(e) => setUserCountryCode(e.target.value.toUpperCase())}
                      placeholder="e.g., US, NG, UK"
                      maxLength={3}
                      className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none uppercase"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Enter your country code (ISO 2 or 3 letter code)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Required Country Code
                    </label>
                    <input
                      type="text"
                      value={requiredCountryCode}
                      onChange={(e) => setRequiredCountryCode(e.target.value.toUpperCase())}
                      placeholder="e.g., US, NG, UK"
                      maxLength={3}
                      className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none uppercase"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Enter the country code you need to prove membership for
                    </p>
                  </div>
                </div>

                <p className="mt-4 mb-4 text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  Your country code will be hashed and remain private. Only the verification result (match/no match) will be public.
                </p>

                <button
                  onClick={handleGenerateCountryProof}
                  disabled={loading || !userCountryCode || !requiredCountryCode}
                  className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
                    loading || !userCountryCode || !requiredCountryCode
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>{loading ? 'Generating Proof...' : 'Generate Nationality Proof'}</span>
                </button>
              </div>
            )}

            {proofType === 'uniqueness' && (
              <div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                  <p className="text-xs text-blue-300">
                    This will generate a uniqueness proof bound to your connected wallet address: {address?.substring(0, 10)}...
                  </p>
                </div>
                <button
                  onClick={handleGenerateUniquenessProof}
                  disabled={loading}
                  className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
                    loading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>{loading ? 'Generating Proof...' : 'Generate Uniqueness Proof'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

