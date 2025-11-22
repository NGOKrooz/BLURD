'use client';

import { useState } from 'react';
import { Upload, CheckCircle2, XCircle, AlertCircle, Shield } from 'lucide-react';

export default function VerifyProof() {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [publicSignalsFile, setPublicSignalsFile] = useState<File | null>(null);
  const [verificationKeyFile, setVerificationKeyFile] = useState<File | null>(null);
  const [proofJson, setProofJson] = useState('');
  const [publicSignalsJson, setPublicSignalsJson] = useState('');
  const [verificationKeyJson, setVerificationKeyJson] = useState('');
  const [useFileInput, setUseFileInput] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const handleFileChange = (type: 'proof' | 'signals' | 'key', file: File | null) => {
    if (type === 'proof') setProofFile(file);
    else if (type === 'signals') setPublicSignalsFile(file);
    else if (type === 'key') setVerificationKeyFile(file);
  };

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);

    try {
      let proof: any;
      let publicSignals: any[];
      let verificationKey: any;

      if (useFileInput) {
        if (!proofFile || !publicSignalsFile || !verificationKeyFile) {
          setResult({ valid: false, error: 'Please upload all required files' });
          setLoading(false);
          return;
        }

        const proofText = await proofFile.text();
        const signalsText = await publicSignalsFile.text();
        const keyText = await verificationKeyFile.text();

        proof = JSON.parse(proofText);
        publicSignals = JSON.parse(signalsText);
        verificationKey = JSON.parse(keyText);
      } else {
        if (!proofJson.trim() || !publicSignalsJson.trim() || !verificationKeyJson.trim()) {
          setResult({ valid: false, error: 'Please enter all required JSON' });
          setLoading(false);
          return;
        }

        proof = JSON.parse(proofJson);
        publicSignals = JSON.parse(publicSignalsJson);
        verificationKey = JSON.parse(verificationKeyJson);
      }

      // Verify proof using snarkjs (dynamic import for client-side)
      const snarkjs = await import('snarkjs');
      const isValid = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
      setResult({ valid: isValid });
    } catch (error: any) {
      setResult({ valid: false, error: error.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Verify Proof</h1>
        <p className="mt-1 text-sm text-gray-400">Verify zero-knowledge proofs submitted by users</p>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6 space-y-6">
        {/* Input Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Input Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setUseFileInput(true)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                useFileInput
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Upload Files
            </button>
            <button
              onClick={() => setUseFileInput(false)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                !useFileInput
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Paste JSON
            </button>
          </div>
        </div>

        {useFileInput ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proof File (proof.json)
              </label>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-10">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6">
                    <label className="relative cursor-pointer rounded-md font-semibold text-blue-400 hover:text-blue-300">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={(e) => handleFileChange('proof', e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="pl-1 text-gray-400">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-400">JSON up to 1MB</p>
                  {proofFile && (
                    <p className="mt-2 text-sm text-white">{proofFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Public Signals File (public.json)
              </label>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-10">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6">
                    <label className="relative cursor-pointer rounded-md font-semibold text-blue-400 hover:text-blue-300">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={(e) => handleFileChange('signals', e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="pl-1 text-gray-400">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-400">JSON up to 1MB</p>
                  {publicSignalsFile && (
                    <p className="mt-2 text-sm text-white">{publicSignalsFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verification Key File (verification_key.json)
              </label>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-10">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6">
                    <label className="relative cursor-pointer rounded-md font-semibold text-blue-400 hover:text-blue-400">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept=".json"
                        className="sr-only"
                        onChange={(e) => handleFileChange('key', e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="pl-1 text-gray-400">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-400">JSON up to 1MB</p>
                  {verificationKeyFile && (
                    <p className="mt-2 text-sm text-white">{verificationKeyFile.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proof JSON
              </label>
              <textarea
                value={proofJson}
                onChange={(e) => setProofJson(e.target.value)}
                rows={8}
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="Paste proof JSON here"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Public Signals JSON
              </label>
              <textarea
                value={publicSignalsJson}
                onChange={(e) => setPublicSignalsJson(e.target.value)}
                rows={4}
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="Paste public signals JSON here"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verification Key JSON
              </label>
              <textarea
                value={verificationKeyJson}
                onChange={(e) => setVerificationKeyJson(e.target.value)}
                rows={8}
                className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="Paste verification key JSON here"
              />
            </div>
          </div>
        )}

        {result && (
          <div
            className={`rounded-lg border p-4 flex items-start space-x-3 ${
              result.valid
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            {result.valid ? (
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`text-sm font-semibold ${
                  result.valid ? 'text-green-300' : 'text-red-300'
                }`}
              >
{result.valid ? 'Proof is Valid ✓' : 'Proof is Invalid ✗'}
              </p>
              {result.error && (
                <p className="text-xs text-red-300 mt-1">{result.error}</p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={
            loading ||
            (useFileInput && (!proofFile || !publicSignalsFile || !verificationKeyFile)) ||
            (!useFileInput && (!proofJson.trim() || !publicSignalsJson.trim() || !verificationKeyJson.trim()))
          }
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify Proof'}
        </button>
      </div>

      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-300 mb-2">How Verification Works</h3>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>The proof verifies that the user knows private inputs that satisfy the circuit constraints</li>
              <li>Public signals reveal only what was intended to be public (like age &gt;= 18)</li>
              <li>No personal information is revealed during verification</li>
              <li>Each proof is unique and cannot be reused or forged</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

