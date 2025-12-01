'use client';

import { useState } from 'react';
import { Upload, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useStarknet } from '@/providers/starknet-provider';
import WalletConnect from '@/components/WalletConnect';
import CredentialUpload from '@/components/CredentialUpload';
import { computeIdCommit, computeUniqueKey, computeUniqueKeyHash, generateNonce } from '@/lib/crypto';

interface ExtractedFields {
  dob?: string;
  docType?: string;
  expiry?: string;
}

export default function IssueCredential() {
  const { address, isConnected } = useStarknet();
  const [extractedFields, setExtractedFields] = useState<ExtractedFields>({});
  const [manualFields, setManualFields] = useState<ExtractedFields>({
    dob: '',
    docType: 'passport',
    expiry: ''
  });
  const [useManual, setUseManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idCommit, setIdCommit] = useState<string | null>(null);
  const [uniqueKeyHash, setUniqueKeyHash] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = (fields: ExtractedFields) => {
    setExtractedFields(fields);
    setError(null);
  };

  const handleManualEntry = () => {
    setUseManual(true);
    setExtractedFields({});
  };

  const handleIssue = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    const fields = useManual ? manualFields : extractedFields;
    
    if (!fields.dob || !fields.expiry) {
      setError('Please provide DOB and expiry date');
      return;
    }

    if (!fields.docType) {
      fields.docType = 'passport';
    }

    setLoading(true);
    setError(null);

    try {
      // Generate nonce
      const nonce = generateNonce();

      // Compute id_commit locally
      const commit = await computeIdCommit({
        dob: fields.dob,
        docType: fields.docType,
        expiry: fields.expiry,
        nonce
      });

      setIdCommit(commit);

      // Compute unique_key locally (binding to wallet address)
      const uniqueKey = await computeUniqueKey(commit, address);

      // Compute unique_key_hash (what server stores)
      const hash = await computeUniqueKeyHash(uniqueKey);
      setUniqueKeyHash(hash);

      // Register with server (only sends unique_key_hash)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/register-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unique_key_hash: hash,
        })
      });

      const data = await response.json();

      if (response.status === 409) {
        setError('This credential has already been registered');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store credential locally for future use
      const credential = {
        id: data.id || Date.now().toString(),
        idCommit: commit,
        uniqueKeyHash: hash,
        fields: { ...fields, nonce },
        issuedAt: new Date().toISOString(),
        walletAddress: address // Store wallet address for proof generation
      };

      // Store in localStorage
      const stored = localStorage.getItem('blurd_credentials');
      const credentials = stored ? JSON.parse(stored) : [];
      credentials.push(credential);
      localStorage.setItem('blurd_credentials', JSON.stringify(credentials));

      setRegistered(true);
    } catch (error: any) {
      console.error('Credential issuance error:', error);
      setError(error.message || 'Failed to issue credential');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-12 max-w-md text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Privacy Pass Registered</h2>
          <p className="text-sm text-gray-400 mb-6">
            Your privacy pass has been registered. You can now generate proofs.
          </p>
          {uniqueKeyHash && (
            <div className="bg-neutral-800/40 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-gray-400 mb-1">Unique Key Hash:</p>
              <p className="text-xs text-blue-400 font-mono break-all">{uniqueKeyHash}</p>
            </div>
          )}
          <div className="space-y-3">
            <Link
              href="/credentials/list"
              className="block w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors text-center"
            >
              View Privacy Passes
            </Link>
            <Link
              href="/credentials/generate-proof"
              className="block w-full rounded-md border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors text-center"
            >
              Generate Proof
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/credentials/list" className="text-sm text-gray-400 hover:text-white">
          ← Back to Privacy Passes
        </Link>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Get Your Privacy Pass</h1>
        <p className="text-sm text-gray-400 mb-6">
          Show your ID once. Blurd checks it, forgets it, and gives you a reusable pass.
        </p>
        
        {/* Privacy Banner */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            🔒 <strong>Privacy:</strong> Your document is checked once, then permanently deleted. Only a privacy-protected credential is created.
          </p>
        </div>

        {!isConnected && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300 mb-2">Connect your wallet to issue a credential</p>
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

        {!useManual ? (
          <div className="space-y-6">
            <CredentialUpload onExtract={handleExtract} onError={setError} />
            <div className="text-center">
              <button
                onClick={handleManualEntry}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Or enter details manually
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="text"
                value={manualFields.dob}
                onChange={(e) => setManualFields({ ...manualFields, dob: e.target.value })}
                placeholder="YYYY-MM-DD or MM/DD/YYYY"
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Type
              </label>
              <select
                value={manualFields.docType}
                onChange={(e) => setManualFields({ ...manualFields, docType: e.target.value })}
                className="block w-full rounded-md border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                <option value="passport">Passport</option>
                <option value="driver_license">Driver&apos;s License</option>
                <option value="national_id">National ID</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                value={manualFields.expiry}
                onChange={(e) => setManualFields({ ...manualFields, expiry: e.target.value })}
                placeholder="YYYY-MM-DD or MM/DD/YYYY"
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setUseManual(false)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back to file upload
            </button>
          </div>
        )}

        {(extractedFields.dob || manualFields.dob) && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-xs text-blue-300 mb-2">
                🔒 <strong>Privacy:</strong> Only a cryptographic hash will be sent to the server. 
                Your document and extracted fields never leave your device.
              </p>
            </div>
            <button
              onClick={handleIssue}
              disabled={loading}
              className={loading
                ? 'w-full rounded-md bg-gray-600 px-6 py-3 text-sm font-semibold text-white cursor-not-allowed'
                : 'w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors'
              }
            >
              {loading ? 'Registering Privacy Pass...' : 'Register Privacy Pass'}
            </button>
          </div>
        )}

        {idCommit && (
          <div className="mt-6 bg-neutral-800/40 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">ID Commit (debug):</p>
            <p className="text-xs text-blue-400 font-mono break-all">{idCommit.slice(0, 42)}...</p>
          </div>
        )}
      </div>
    </div>
  );
}
