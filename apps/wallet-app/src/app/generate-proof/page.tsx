'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import copy from 'copy-to-clipboard';
// Note: In production, these would be imported from a shared package or API
// For demo, using inline implementations
const CIRCUIT_TYPES = {
  VERIFIED: 'verified',
  AGE: 'age',
  COUNTRY: 'country',
};

async function generateVerifiedProof(userSecret: string, issuerSignature: string) {
  const proof = { pi_a: ['0', '0'], pi_b: [['0', '0'], ['0', '0']], pi_c: ['0', '0'], protocol: 'groth16' };
  const publicSignals = ['1'];
  const proofHash = await hashProof(proof);
  return { proof, publicSignals, proofHash };
}

async function generateAgeProof(userAge: number, minAge: number) {
  if (userAge < minAge) throw new Error('User age is below minimum');
  const proof = { pi_a: ['0', '0'], pi_b: [['0', '0'], ['0', '0']], pi_c: ['0', '0'], protocol: 'groth16' };
  const publicSignals = ['1'];
  const proofHash = await hashProof(proof);
  return { proof, publicSignals, proofHash };
}

async function generateCountryProof(userHash: string, requiredHash: string) {
  if (userHash !== requiredHash) throw new Error('Country hash does not match');
  const proof = { pi_a: ['0', '0'], pi_b: [['0', '0'], ['0', '0']], pi_c: ['0', '0'], protocol: 'groth16' };
  const publicSignals = ['1'];
  const proofHash = await hashProof(proof);
  return { proof, publicSignals, proofHash };
}

async function hashProof(proof: any): Promise<string> {
  const proofString = JSON.stringify(proof);
  const encoder = new TextEncoder();
  const data = encoder.encode(proofString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function GenerateProof() {
  const [circuitType, setCircuitType] = useState<string>(CIRCUIT_TYPES.VERIFIED);
  const [proof, setProof] = useState<any>(null);
  const [publicSignals, setPublicSignals] = useState<any>(null);
  const [proofHash, setProofHash] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [ageInputs, setAgeInputs] = useState({ userAge: 25, minAge: 18 });
  const [countryInputs, setCountryInputs] = useState({ userCountry: 'US', requiredCountry: 'US' });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let result;
      
      if (circuitType === CIRCUIT_TYPES.VERIFIED) {
        const userSecret = Math.random().toString(36);
        const issuerSignature = Math.random().toString(36);
        result = await generateVerifiedProof(userSecret, issuerSignature);
      } else if (circuitType === CIRCUIT_TYPES.AGE) {
        result = await generateAgeProof(ageInputs.userAge, ageInputs.minAge);
      } else if (circuitType === CIRCUIT_TYPES.COUNTRY) {
        const userHash = Buffer.from(countryInputs.userCountry).toString('hex');
        const requiredHash = Buffer.from(countryInputs.requiredCountry).toString('hex');
        result = await generateCountryProof(userHash, requiredHash);
      }

      if (result) {
        setProof(result.proof);
        setPublicSignals(result.publicSignals);
        setProofHash(result.proofHash);
      }
    } catch (error: any) {
      alert(`Error generating proof: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyProof = () => {
    if (proof) {
      copy(JSON.stringify({ proof, publicSignals }, null, 2));
      alert('Proof copied to clipboard!');
    }
  };

  const copyHash = () => {
    if (proofHash) {
      copy(proofHash);
      alert('Proof hash copied to clipboard!');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Generate ZK Proof</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Select Proof Type</h2>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="radio"
                value={CIRCUIT_TYPES.VERIFIED}
                checked={circuitType === CIRCUIT_TYPES.VERIFIED}
                onChange={(e) => setCircuitType(e.target.value)}
                className="mr-2"
              />
              <span>Verified Proof (I am verified)</span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                value={CIRCUIT_TYPES.AGE}
                checked={circuitType === CIRCUIT_TYPES.AGE}
                onChange={(e) => setCircuitType(e.target.value)}
                className="mr-2"
              />
              <span>Age Proof (I am above age X)</span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                value={CIRCUIT_TYPES.COUNTRY}
                checked={circuitType === CIRCUIT_TYPES.COUNTRY}
                onChange={(e) => setCircuitType(e.target.value)}
                className="mr-2"
              />
              <span>Country Proof (I am from Country X)</span>
            </label>
          </div>

          {circuitType === CIRCUIT_TYPES.AGE && (
            <div className="mt-4 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Your Age</label>
                <input
                  type="number"
                  value={ageInputs.userAge}
                  onChange={(e) => setAgeInputs({ ...ageInputs, userAge: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Required Age</label>
                <input
                  type="number"
                  value={ageInputs.minAge}
                  onChange={(e) => setAgeInputs({ ...ageInputs, minAge: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}

          {circuitType === CIRCUIT_TYPES.COUNTRY && (
            <div className="mt-4 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Your Country Code</label>
                <input
                  type="text"
                  value={countryInputs.userCountry}
                  onChange={(e) => setCountryInputs({ ...countryInputs, userCountry: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="US"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Required Country Code</label>
                <input
                  type="text"
                  value={countryInputs.requiredCountry}
                  onChange={(e) => setCountryInputs({ ...countryInputs, requiredCountry: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="US"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Proof'}
          </button>
        </div>

        {proof && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Generated Proof</h2>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Proof Hash</label>
                <button
                  onClick={copyHash}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Copy
                </button>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded break-all text-sm font-mono">
                {proofHash}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">QR Code</label>
              </div>
              <div className="flex justify-center p-4 bg-white rounded">
                <QRCodeSVG value={proofHash} size={200} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Proof JSON</label>
                <button
                  onClick={copyProof}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto text-xs">
                {JSON.stringify({ proof, publicSignals }, null, 2)}
              </pre>
            </div>

            <Link
              href={`/send-payment?proofHash=${proofHash}`}
              className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 text-center"
            >
              Continue to Send Payment →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

