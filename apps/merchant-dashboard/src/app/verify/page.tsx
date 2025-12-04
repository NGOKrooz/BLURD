'use client';

import { useState } from 'react';
import { Upload, FileJson, Hash } from 'lucide-react';
import { clsx } from 'clsx';
import { VerificationResultCard, type VerificationResult, type ProofType } from '@/components/VerificationResultCard';
import { saveVerification } from '@/lib/verification-history';

type InputMode = 'file' | 'hash';

export default function Verify() {
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofHash, setProofHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setProofFile(file);
  };

  const detectProofType = (proof: any): ProofType => {
    // Check circuit type or claim type from proof
    if (proof.circuitType === 'age18' || proof.claimType === 'age18') {
      return 'age18';
    }
    if (proof.circuitType === 'country' || proof.claimType === 'nationality' || proof.claimType === 'country') {
      return 'country';
    }
    // Check public signals for age proof (typically contains age threshold)
    if (proof.publicSignals && Array.isArray(proof.publicSignals)) {
      // Age proofs typically have specific public signal patterns
      if (proof.publicSignals.length === 1 && typeof proof.publicSignals[0] === 'string') {
        // Could be age proof
        return 'age18';
      }
    }
    return 'unknown';
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      if (inputMode === 'file' && !proofFile) {
        throw new Error('Please upload a proof JSON file.');
      }
      if (inputMode === 'hash' && !proofHash.trim()) {
        throw new Error('Please provide a proof hash.');
      }

      let proofData: any = null;
      let detectedProofHash = '';

      if (inputMode === 'file' && proofFile) {
        const text = await proofFile.text();
        try {
          proofData = JSON.parse(text);
          detectedProofHash = proofData.proofHash || proofData.hash || '';
        } catch {
          throw new Error('Uploaded proof file is not valid JSON.');
        }
      } else if (inputMode === 'hash') {
        detectedProofHash = proofHash.trim();
      }

      // Detect proof type
      const proofType = proofData ? detectProofType(proofData) : 'unknown';

      // Placeholder API integration
      // Replace this block with a real call to the deployed BLURD API:
      //
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // const res = await fetch(`${apiUrl}/api/merchant/verify`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ proof: proofData, proofHash: detectedProofHash }),
      // });
      // if (!res.ok) throw new Error('Verification failed');
      // const data = await res.json();
      // setResult({
      //   verified: data.verified,
      //   proofType: data.proofType || proofType,
      //   proofHash: data.proofHash || detectedProofHash,
      //   ageVerified: data.ageVerified,
      //   countryVerified: data.countryVerified,
      // });

      // Hackathon/demo verification logic
      // For demo: if proof structure is valid, consider it verified
      const isValidProof = proofData && (
        (proofData.pi_a && proofData.pi_b && proofData.pi_c) || // Groth16 format
        (proofData.proof && proofData.publicSignals) // Alternative format
      );

      const demoResult: VerificationResult = {
        verified: isValidProof || !!detectedProofHash,
        proofType: proofType,
        proofHash: detectedProofHash || (proofData?.proofHash || proofData?.hash || '0x...'),
        ageVerified: proofType === 'age18' && isValidProof,
        countryVerified: proofType === 'country' && isValidProof,
      };

      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 700));
      setResult(demoResult);

      // Save to history
      saveVerification(demoResult);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProofFile(null);
    setProofHash('');
    setResult(null);
    setError(null);
  };

  const isRunDisabled =
    loading ||
    (inputMode === 'file' && !proofFile) ||
    (inputMode === 'hash' && !proofHash.trim());

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">
          Identity Proof Verification
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-400">
          Verify age and country proofs without accessing personal information.
        </p>
      </div>

      <div className="bg-neutral-950/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-5 sm:p-6 space-y-6">
        {/* Input mode selector */}
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-300 mb-3">
            Proof Source
          </p>
          <div className="inline-grid grid-cols-2 gap-2 rounded-xl bg-neutral-900/80 border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors',
                inputMode === 'file'
                  ? 'bg-white text-neutral-900'
                  : 'text-gray-300 hover:bg-white/5'
              )}
            >
              <FileJson className="h-4 w-4" />
              <span>Proof JSON Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('hash')}
              className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors',
                inputMode === 'hash'
                  ? 'bg-white text-neutral-900'
                  : 'text-gray-300 hover:bg-white/5'
              )}
            >
              <Hash className="h-4 w-4" />
              <span>Proof Hash Lookup</span>
            </button>
          </div>
        </div>

        {/* Proof JSON upload */}
        {inputMode === 'file' && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Proof JSON
            </label>
            <div className="mt-1 flex justify-center rounded-xl border border-dashed border-white/20 bg-neutral-900/60 px-6 py-8">
              <div className="text-center space-y-3">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <div className="flex flex-col items-center gap-2 text-xs sm:text-sm text-gray-300">
                  <label className="relative cursor-pointer rounded-md font-semibold text-blue-400 hover:text-blue-300">
                    <span>Upload proof.json</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="sr-only"
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] ? e.target.files[0] : null)
                      }
                    />
                  </label>
                  <p className="text-[11px] text-gray-500">
                    JSON only, up to 1MB. No personal data required.
                  </p>
                  {proofFile && (
                    <p className="text-[11px] text-gray-300 truncate max-w-xs">
                      {proofFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proof hash lookup */}
        {inputMode === 'hash' && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Proof Hash
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={proofHash}
              onChange={(e) => setProofHash(e.target.value)}
              className="block w-full rounded-lg border border-white/10 bg-neutral-900/70 px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        )}


        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-500/30 px-3 py-2.5 text-xs sm:text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-1">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isRunDisabled}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
          >
            {loading ? 'Running verification…' : 'Run Verification'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium text-gray-200 hover:bg-white/10 transition-colors w-full sm:w-auto"
          >
            Clear
          </button>
        </div>
      </div>

      <VerificationResultCard result={result} />
    </div>
  );
}
