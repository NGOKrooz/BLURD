'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, QrCode, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PrivacyBanner from '@/components/PrivacyBanner';

interface Credential {
  id: string;
  idCommit: string;
  uniqueKeyHash: string;
  fields: {
    dob: string;
    docType: string;
    expiry: string;
    nonce: string;
  };
  issuedAt: string;
  walletAddress?: string;
  userId?: string; // Legacy support
}

export default function GenerateProof() {
  const searchParams = useSearchParams();
  const credentialId = searchParams.get('id');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(false);
  const [proof, setProof] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCredentials = useCallback(() => {
    const stored = localStorage.getItem('blurd_credentials');
    if (stored) {
      const creds = JSON.parse(stored);
      setCredentials(creds);
      if (creds.length > 0 && !selectedCredential) {
        setSelectedCredential(creds[0]);
      }
    }
  }, [selectedCredential]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    if (credentialId && credentials.length > 0) {
      const cred = credentials.find(c => c.id === credentialId);
      if (cred) {
        setSelectedCredential(cred);
      }
    }
  }, [credentialId, credentials]);

  const generateProof = async () => {
    if (!selectedCredential) {
      setError('Please select a credential');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load SnarkJS
      const snarkjs = await import('snarkjs');

      // Get wallet address (support both new and legacy format)
      const walletAddress = selectedCredential.walletAddress || selectedCredential.userId;
      if (!walletAddress) {
        throw new Error('Credential missing wallet address');
      }

      // Compute wallet address hash (SHA256 for circuit input)
      const walletHash = await sha256(walletAddress.toLowerCase());

      // Compute unique_key from id_commit and wallet_address (must match registration)
      const { computeUniqueKey } = await import('@/lib/crypto');
      const uniqueKey = await computeUniqueKey(selectedCredential.idCommit, walletAddress);
      
      // Compute unique_key_hash (must match what's registered on server)
      const { computeUniqueKeyHash } = await import('@/lib/crypto');
      const uniqueKeyHash = await computeUniqueKeyHash(uniqueKey);

      // Prepare inputs for credential_preimage circuit
        // Circuit expects: id_commit, wallet_address_hash, unique_key (private) and unique_key_hash (public)
        const inputs = {
          id_commit: BigInt(selectedCredential.idCommit),
          user_id_hash: BigInt(walletHash), // Note: circuit still uses user_id_hash name but it's wallet address
          unique_key: BigInt(uniqueKey),
          unique_key_hash: BigInt(uniqueKeyHash)
        };

      // Use credential_preimage circuit
      const wasmPath = '/zk/credential_preimage.wasm';
      const zkeyPath = '/zk/credential_preimage.zkey';

      console.log('📝 Generating credential proof...');
      const { proof: generatedProof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        wasmPath,
        zkeyPath
      );

      // Wrap proof with credential metadata
      const proofData = {
        proof: {
          pi_a: generatedProof.pi_a,
          pi_b: generatedProof.pi_b,
          pi_c: generatedProof.pi_c,
          protocol: 'groth16'
        },
        publicSignals,
        credentialId: selectedCredential.id,
        uniqueKeyHash: uniqueKeyHash,
        metadata: {
          issuedAt: selectedCredential.issuedAt,
          docType: selectedCredential.fields.docType
        }
      };

      setProof(proofData);
    } catch (error: any) {
      console.error('Proof generation error:', error);
      setError(error.message || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const downloadProof = () => {
    if (!proof) return;

    const proofBlob = new Blob([JSON.stringify(proof.proof, null, 2)], {
      type: 'application/json',
    });
    const proofUrl = URL.createObjectURL(proofBlob);
    const proofLink = document.createElement('a');
    proofLink.href = proofUrl;
    proofLink.download = `credential-proof-${proof.credentialId}.json`;
    proofLink.click();
    URL.revokeObjectURL(proofUrl);

    const publicBlob = new Blob([JSON.stringify(proof.publicSignals, null, 2)], {
      type: 'application/json',
    });
    const publicUrl = URL.createObjectURL(publicBlob);
    const publicLink = document.createElement('a');
    publicLink.href = publicUrl;
    publicLink.download = `credential-public-${proof.credentialId}.json`;
    publicLink.click();
    URL.revokeObjectURL(publicUrl);
  };

  const sha256 = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/credentials/list" className="text-sm text-gray-400 hover:text-white">
          ← Back to Credentials
        </Link>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Generate Your Privacy Pass</h1>
        <p className="text-sm text-gray-400 mb-6">
          Get a reusable pass to prove your attributes without revealing your identity
        </p>
        
        {/* Privacy Banner */}
        <div className="mb-6">
          <PrivacyBanner variant="info" />
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {credentials.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-4">No credentials found</p>
            <Link
              href="/credentials/issue"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Issue a credential first
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Credential
              </label>
              <select
                value={selectedCredential?.id || ''}
                onChange={(e) => {
                  const cred = credentials.find(c => c.id === e.target.value);
                  setSelectedCredential(cred || null);
                }}
                className="block w-full rounded-md border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
              >
                {credentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.fields.docType?.toUpperCase()} - {new Date(cred.issuedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedCredential && (
              <div className="mb-6 bg-neutral-800/40 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Unique Key Hash:</p>
                <p className="text-xs text-blue-400 font-mono break-all">{selectedCredential.uniqueKeyHash}</p>
              </div>
            )}

            {!proof ? (
              <button
                onClick={generateProof}
                disabled={loading || !selectedCredential}
                className={loading || !selectedCredential
                  ? 'w-full rounded-md bg-gray-600 px-6 py-3 text-sm font-semibold text-white cursor-not-allowed'
                  : 'w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors'
                }
              >
                {loading ? 'Generating Privacy Pass...' : 'Generate Privacy Pass'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <p className="text-sm text-green-300">Proof generated successfully</p>
                </div>

                <div className="bg-neutral-800/40 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Proof Hash:</p>
                  <p className="text-xs text-blue-400 font-mono break-all">
                    {proof.uniqueKeyHash}
                  </p>
                </div>

                <div className="flex">
                  <button
                    onClick={downloadProof}
                    className="flex-1 flex items-center justify-center space-x-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Proof</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

