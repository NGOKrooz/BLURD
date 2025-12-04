'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import { extractFields } from '@/utils/extractFields';
import { simpleOCR } from '@/utils/simpleOCR';

type DocumentType = 'passport' | 'student-id' | 'driver-license' | 'other' | '';

interface ExtractedFields {
  dateOfBirth?: string;
  country?: string;
  studentId?: string;
  documentType?: string;
  [key: string]: any;
}

export default function UploadCredential() {
  const { address, isConnected } = useAccount();
  const [documentType, setDocumentType] = useState<DocumentType>('');
  const [customDocumentLabel, setCustomDocumentLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedFields | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setExtractedFields(null);
    }
  };

  const handleUpload = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Extract raw text using OCR, then parse fields
      const rawText = await simpleOCR(file);
      const fields = extractFields(rawText);
      
      // Bind credential to wallet address using Poseidon hash
      const { poseidon } = await import('circomlibjs');
      const walletBigInt = BigInt('0x' + address.slice(2, 18)); // Use first 16 hex chars
      const walletHash = poseidon([walletBigInt]);
      const documentHash = poseidon([BigInt(file.name.length + file.size)]);
      const credentialHash = poseidon([walletHash, documentHash]);

      // Store credential locally
      const credential = {
        id: Date.now().toString(),
        walletAddress: address,
        documentType: documentType === 'other' && customDocumentLabel.trim() ? customDocumentLabel.trim() : documentType,
        fileName: file.name,
        fileSize: file.size,
        extractedFields: fields,
        credentialHash: credentialHash.toString(),
        uploadedAt: new Date().toISOString(),
      };

      // Save to localStorage
      const existingCredentials = localStorage.getItem('blurd_credentials');
      const credentials = existingCredentials ? JSON.parse(existingCredentials) : [];
      credentials.push(credential);
      localStorage.setItem('blurd_credentials', JSON.stringify(credentials));

      setExtractedFields(fields);
      setSuccess(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      // Show a friendly, generic error instead of low-level library messages
      setError('We could not process this document. Please try a clearer image or a different file format.');
    } finally {
      setUploading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
            Please connect your wallet to upload credentials. Your wallet address will be used to bind your credential.
          </p>
          <WalletConnect />
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
        <h1 className="text-2xl font-semibold text-white mb-2">Upload Credential</h1>
        <p className="text-sm text-gray-400 mb-6">
          Upload your ID document to extract fields and bind it to your wallet address.
        </p>

        {success && extractedFields ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-green-400">Credential Uploaded Successfully</h3>
              </div>
              <p className="text-sm text-green-300">
                Your credential has been bound to your wallet address and stored locally.
              </p>
            </div>

            <div className="bg-neutral-800/40 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Extracted Fields</h4>
              <div className="space-y-2">
                {Object.entries(extractedFields).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-gray-400 capitalize">{key}</span>
                    <span className="text-xs text-white font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-300 mb-1">Privacy Protected</p>
                  <p className="text-xs text-blue-200">
                    Your credential is stored locally in your browser. Only you have access to the full document.
                    The credential hash is bound to your wallet address for verification purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/generate-proof"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 text-center"
              >
                Generate Proof
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setFile(null);
                  setExtractedFields(null);
                  setDocumentType('');
                }}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Upload Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select document type</option>
                <option value="passport">Passport</option>
                <option value="student-id">Student ID</option>
                <option value="driver-license">Driver License</option>
                <option value="other">Other</option>
              </select>
              {documentType === 'other' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Describe document
                  </label>
                  <input
                    type="text"
                    value={customDocumentLabel}
                    onChange={(e) => setCustomDocumentLabel(e.target.value)}
                    placeholder="e.g. Employee ID, Residency Card"
                    className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Document
              </label>
              <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-300 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </label>
                {file && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-white">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !documentType}
              className={`w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all ${
                uploading || !file || !documentType
                  ? 'bg-gray-600 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
              }`}
            >
              {uploading ? 'Processing...' : 'Upload & Extract Fields'}
            </button>

            {/* Privacy Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-300 mb-1">Privacy First</p>
                  <p className="text-xs text-blue-200">
                    Your document is processed locally in your browser. No data is sent to any server.
                    Only extracted fields are stored locally, bound to your wallet address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

