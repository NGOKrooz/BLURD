'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Key, CheckCircle2, Download, Shield } from 'lucide-react';
import { clsx } from 'clsx';

export default function GenerateProof() {
  const [loading, setLoading] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [proof, setProof] = useState<any>(null);

  const handleGenerateProof = async () => {
    setLoading(true);
    setProofGenerated(false);

    try {
      // TODO: Implement actual proof generation using snarkjs
      // This is a placeholder - replace with actual Circom proof generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockProof = {
        proof: {
          pi_a: ['0x1234...', '0x5678...'],
          pi_b: [['0xabcd...', '0xef01...'], ['0x2345...', '0x6789...']],
          pi_c: ['0x9876...', '0x5432...']
        },
        publicSignals: ['0x1111...'],
        proofHash: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0')).join(''),
        generatedAt: new Date().toISOString()
      };
      
      setProof(mockProof);
      setProofGenerated(true);

      // Store proof in localStorage
      const stored = localStorage.getItem('blurd_proofs');
      const proofs = stored ? JSON.parse(stored) : [];
      proofs.push(mockProof);
      localStorage.setItem('blurd_proofs', JSON.stringify(proofs));
    } catch (error: any) {
      console.error('Proof generation error:', error);
      alert('Failed to generate proof: ' + error.message);
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
    link.download = `proof-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (proofGenerated && proof) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Proof Generated</h1>
          <p className="mt-1 text-sm text-gray-400">Your zero-knowledge proof is ready</p>
            </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <h2 className="text-lg font-semibold text-green-300">Proof Generated Successfully</h2>
          </div>
          <p className="text-sm text-green-200 mb-4">
            Your zero-knowledge proof has been generated and is ready to share.
          </p>
          <div className="bg-neutral-800/40 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-400 mb-1">Proof Hash:</p>
            <p className="text-xs text-blue-400 font-mono break-all">{proof.proofHash}</p>
          </div>
          <div className="flex space-x-3">
          <button
              onClick={handleDownload}
              className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
              <Download className="h-4 w-4" />
              <span>Download Proof</span>
          </button>
            <Link
              href="/verify"
              className="flex items-center space-x-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <Key className="h-4 w-4" />
              <span>Verify Proof</span>
            </Link>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Proof Details</h3>
          <div className="bg-neutral-800/40 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
            <pre>{JSON.stringify(proof, null, 2).substring(0, 500)}...</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Generate Zero-Knowledge Proof</h1>
        <p className="mt-1 text-sm text-gray-400">Create a privacy pass from your credentials</p>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-8">
        <div className="mb-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              🔒 <strong>Privacy:</strong> Your proof is generated locally and never reveals your identity. 
              Only a &apos;YES&apos; or &apos;NO&apos; is shared.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-300">
            Select a credential to generate a zero-knowledge proof from. The proof will prove that you 
            meet certain criteria (e.g., age &gt;= 18) without revealing your actual age or other personal information.
          </p>
            </div>

              <button
          onClick={handleGenerateProof}
          disabled={loading}
                className={clsx(
            'w-full rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors flex items-center justify-center space-x-2',
            loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              <span>Generating Proof...</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              <span>Generate Proof</span>
            </>
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">How It Works</h3>
          <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
            <li>Select a credential from your stored privacy passes</li>
            <li>Choose what attribute you want to prove (e.g., age verification)</li>
            <li>The proof is generated locally on your device</li>
            <li>Only the proof (not your personal data) is shared</li>
            <li>Verifiers can confirm the proof is valid without learning your identity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
