'use client';

import { useState } from 'react';
import { Upload, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

export default function Verify() {
  const [inputMethod, setInputMethod] = useState<'file' | 'json' | 'hash'>('hash');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [signalsFile, setSignalsFile] = useState<File | null>(null);
  const [proofJson, setProofJson] = useState('');
  const [signalsJson, setSignalsJson] = useState('');
  const [txid, setTxid] = useState('');
  const [proofHash, setProofHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (type: 'proof' | 'signals', file: File | null) => {
    if (type === 'proof') {
      setProofFile(file);
    } else {
      setSignalsFile(file);
    }
  };

  const hashProof = async (proofText: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(proofText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      let proof: any;
      let publicSignals: any[];

      // Get proof and signals based on input method
      if (inputMethod === 'file') {
        if (!proofFile || !signalsFile) {
          setError('Please upload both proof and public signals files');
          setLoading(false);
          return;
        }
      const proofContent = await proofFile.text();
      const signalsContent = await signalsFile.text();
        proof = JSON.parse(proofContent);
        publicSignals = JSON.parse(signalsContent);
      } else if (inputMethod === 'json') {
        if (!proofJson.trim() || !signalsJson.trim()) {
          setError('Please enter both proof and public signals JSON');
          setLoading(false);
          return;
        }
        proof = JSON.parse(proofJson);
        publicSignals = JSON.parse(signalsJson);
      } else if (inputMethod === 'hash') {
        // Look up proof by hash from API
        if (!proofHash.trim()) {
          setError('Please enter a proof hash to look up');
          setLoading(false);
          return;
        }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const lookupResponse = await fetch(`${apiUrl}/api/proofs/get/${proofHash}`);
        if (!lookupResponse.ok) {
          throw new Error('Proof not found. Please verify the proof hash or use file/JSON input.');
        }
        const proofData = await lookupResponse.json();
        proof = proofData.proof;
        publicSignals = proofData.publicSignals;
      } else {
        setError('Invalid input method');
        setLoading(false);
        return;
      }

      // Use real Circom/SnarkJS verifier, fall back to Noir if available
      let zkVerified = false;
      try {
        let verifyProof: any;
        let validateProofStructure: any;
        let validatePublicInputs: any;
        
        // Try Circom verifier first
        try {
          const circomModule = await import('@/lib/zk/circom-verifier');
          verifyProof = circomModule.verifyProof;
          validateProofStructure = circomModule.validateProofStructure;
          validatePublicInputs = circomModule.validatePublicInputs;
        } catch (circomError) {
          // Fall back to Noir verifier
          try {
            const noirModule = await import('@/lib/zk/noir-verifier');
            verifyProof = noirModule.verifyProof;
            validateProofStructure = noirModule.validateProofStructure;
            validatePublicInputs = noirModule.validatePublicInputs;
          } catch (noirError) {
            throw new Error('Neither Circom nor Noir verifier is available');
          }
        }
        
        // Validate structure first
        const proofValidation = validateProofStructure(proof);
        const inputsValidation = validatePublicInputs(publicSignals);
        
        if (!proofValidation.valid) {
          throw new Error(proofValidation.error || 'Invalid proof structure');
        }
        if (!inputsValidation.valid) {
          throw new Error(inputsValidation.error || 'Invalid public inputs structure');
        }

        // Verify using Circom/Noir verifier
        const verifyResult = await verifyProof(proof, publicSignals);
        zkVerified = verifyResult.valid;
        
        if (!zkVerified) {
          throw new Error(verifyResult.error || 'Proof verification failed');
        }
      } catch (zkError: any) {
        console.error('ZK verification error:', zkError);
        // If verifiers are not available, fall back to API verification
        if (zkError.message?.includes('not available') || zkError.message?.includes('not compiled')) {
          console.warn('ZK verifier not available, falling back to API verification');
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          const response = await fetch(`${apiUrl}/api/proofs/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proof, publicSignals }),
          });
          const data = await response.json();
          zkVerified = data.valid;
        } else {
          throw zkError;
        }
      }

      // Check credential registration if unique_key_hash provided
      let credentialData = null;
      if (proofHash && proofHash.startsWith('0x')) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          const credentialResponse = await fetch(
            `${apiUrl}/api/check-unique/${proofHash}`
          );
          if (credentialResponse.ok) {
            credentialData = await credentialResponse.json();
          }
        } catch (e) {
          console.error('Credential check failed:', e);
        }
      }

      // Check payment if txid provided
      let paymentData = null;
      if (txid) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          const paymentResponse = await fetch(
            `${apiUrl}/api/payments/check/${txid}`
          );
          if (paymentResponse.ok) {
            paymentData = await paymentResponse.json();
          }
        } catch (e) {
          console.error('Payment check failed:', e);
        }
      }

      // Determine combined state
      let combinedState = 'INVALID';
      if (zkVerified) {
        if (credentialData?.issued) {
          combinedState = paymentData?.confirmed ? 'VERIFIED_AND_PAID' : 'VERIFIED_AND_ISSUED';
        } else if (paymentData?.confirmed) {
          combinedState = 'VERIFIED_AND_PAID';
        } else if (paymentData) {
          combinedState = 'VERIFIED_PENDING';
        } else {
          combinedState = 'VERIFIED_ONLY';
        }
      }

      setResult({
        zkVerified,
        paymentExists: !!paymentData,
        paymentConfirmed: paymentData?.confirmed || false,
        credentialIssued: credentialData?.issued || false,
        proofHashMatches: credentialData?.issued || paymentData?.proofHash === proofHash,
        combinedState,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
      setResult({
        zkVerified: false,
        paymentExists: false,
        paymentConfirmed: false,
        proofHashMatches: false,
        combinedState: 'INVALID',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Verify Privacy Pass & Payment</h1>
        <p className="mt-1 text-sm text-gray-400">
          Verify customer eligibility and payment without accessing any personal information
        </p>
      </div>

      {/* What Merchants See vs Don't See */}
      <div className="mb-6 bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">What You See vs. What You Don't</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="h-5 w-5 text-green-400" />
              <h3 className="text-sm font-semibold text-green-300">What You See</h3>
            </div>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Verification result (YES/NO)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Payment confirmed</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Credential is registered</span>
              </li>
            </ul>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <EyeOff className="h-5 w-5 text-red-400" />
              <h3 className="text-sm font-semibold text-red-300">What You Don't See</h3>
            </div>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Customer name</span>
              </li>
              <li className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Customer age or birthday</span>
              </li>
              <li className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>ID document or photo</span>
              </li>
              <li className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Wallet address or identity</span>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400 text-center">
          Blurd ensures you can verify eligibility and payment without accessing any personal information.
        </p>
      </div>

      {!result ? (
        <div className="max-w-2xl">
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6 space-y-6">
            {/* Input Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Verification Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setInputMethod('hash')}
                  className={clsx(
                    'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                    inputMethod === 'hash'
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  )}
                >
                  Lookup by Hash
                </button>
                <button
                  onClick={() => setInputMethod('json')}
                  className={clsx(
                    'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                    inputMethod === 'json'
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  )}
                >
                  Paste JSON
                </button>
                <button
                  onClick={() => setInputMethod('file')}
                  className={clsx(
                    'rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                    inputMethod === 'file'
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  )}
                >
                  Upload Files
                </button>
              </div>
            </div>

            {/* Hash Lookup Method */}
            {inputMethod === 'hash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Proof Hash
                  </label>
                  <input
                    type="text"
                    value={proofHash}
                    onChange={(e) => setProofHash(e.target.value)}
                    placeholder="Enter proof hash (e.g., 0x...)"
                    className="block w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Enter the proof hash to look up the proof from the server
                  </p>
                </div>
              </div>
            )}

            {/* JSON Paste Method */}
            {inputMethod === 'json' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Proof JSON
                  </label>
                  <textarea
                    value={proofJson}
                    onChange={(e) => setProofJson(e.target.value)}
                    placeholder='Paste proof JSON here: {"pi_a": [...], "pi_b": [...], "pi_c": [...]}'
                    rows={6}
                    className="block w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-mono text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Public Signals JSON
                  </label>
                  <textarea
                    value={signalsJson}
                    onChange={(e) => setSignalsJson(e.target.value)}
                    placeholder='Paste public signals JSON here: ["0x...", "0x..."]'
                    rows={4}
                    className="block w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-mono text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* File Upload Method */}
            {inputMethod === 'file' && (
              <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Proof File
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
                Upload Public Signals File
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
                  {signalsFile && (
                    <p className="mt-2 text-sm text-white">{signalsFile.name}</p>
                  )}
                </div>
              </div>
            </div>
              </div>
            )}

            {/* Additional Fields (for all methods) */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unique Key Hash <span className="text-gray-400 font-normal">(optional, for credential verification)</span>
                </label>
                <input
                  type="text"
                  value={proofHash}
                  onChange={(e) => setProofHash(e.target.value)}
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter unique_key_hash (from credential)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction ID <span className="text-gray-400 font-normal">(optional, for payment verification)</span>
                </label>
                <input
                  type="text"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter transaction ID"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-900/20 border border-red-500/20 p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={
                loading ||
                (inputMethod === 'file' && (!proofFile || !signalsFile)) ||
                (inputMethod === 'json' && (!proofJson.trim() || !signalsJson.trim())) ||
                (inputMethod === 'hash' && !proofHash.trim())
              }
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Running verification...' : 'Run Verification'}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className={clsx(
            'rounded-lg border p-6 backdrop-blur-md',
            result.combinedState === 'VERIFIED_AND_PAID' || result.combinedState === 'VERIFIED_AND_ISSUED'
              ? 'bg-green-900/20 border-green-500/30'
              : result.combinedState === 'VERIFIED_PENDING' || result.combinedState === 'VERIFIED_ONLY'
              ? 'bg-yellow-900/20 border-yellow-500/30'
              : 'bg-red-900/20 border-red-500/30'
          )}>
            <div className="flex items-start space-x-3">
              {(result.combinedState === 'VERIFIED_AND_PAID' || result.combinedState === 'VERIFIED_AND_ISSUED' || result.combinedState === 'VERIFIED_ONLY') ? (
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {result.combinedState === 'VERIFIED_AND_PAID' 
                    ? 'Verification Successful - Payment Confirmed'
                    : result.combinedState === 'VERIFIED_AND_ISSUED'
                    ? 'Verification Successful - Credential Registered'
                    : result.combinedState === 'VERIFIED_ONLY'
                    ? 'Proof Valid'
                    : 'Verification Failed'}
                </h3>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Proof Status</span>
                    <span className="font-medium text-white">{result.zkVerified ? 'Valid' : 'Invalid'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Payment Status</span>
                    <span className="font-medium text-white">
                      {result.paymentExists ? (result.paymentConfirmed ? 'Confirmed' : 'Pending') : 'Not Found'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Proof Hash Match</span>
                    <span className="font-medium text-white">{result.proofHashMatches ? 'Matched' : 'No Match'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => {
                setResult(null);
                setProofFile(null);
                setSignalsFile(null);
                setProofJson('');
                setSignalsJson('');
                setTxid('');
                setProofHash('');
                setInputMethod('hash');
              }}
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Verify Another Proof
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
