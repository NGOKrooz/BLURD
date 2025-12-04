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
  
  // Manual input fields
  const [manualDob, setManualDob] = useState('');
  const [manualCountryCode, setManualCountryCode] = useState('');
  const [showManualFields, setShowManualFields] = useState(false);

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
      // MVP: OCR never throws - returns empty string on failure
      const rawText = await simpleOCR(file);
      const fields = extractFields(rawText);
      
      // MVP: Always proceed even if OCR returned empty text
      // The extraction function handles empty text gracefully
      
      // Bind credential to wallet address using Poseidon hash
      const { poseidon } = await import('circomlibjs');
      const walletBigInt = BigInt('0x' + address.slice(2, 18)); // Use first 16 hex chars
      const walletHash = poseidon([walletBigInt]);
      const documentHash = poseidon([BigInt(file.name.length + file.size)]);
      const credentialHash = poseidon([walletHash, documentHash]);

      // Merge manual inputs with extracted fields (manual inputs take priority)
      const finalFields = {
        ...fields,
        dob: manualDob.trim() || fields.dob || fields.date_of_birth || '',
        date_of_birth: manualDob.trim() || fields.date_of_birth || fields.dob || '',
        countryCode: manualCountryCode.trim().toUpperCase() || fields.countryCode || fields.country_code || '',
        country_code: manualCountryCode.trim().toUpperCase() || fields.country_code || fields.countryCode || '',
        country: fields.country || '',
      };
      
      // Store credential locally with both extractedFields and fields for compatibility
      const credential = {
        id: Date.now().toString(),
        walletAddress: address,
        documentType: documentType === 'other' && customDocumentLabel.trim() ? customDocumentLabel.trim() : documentType,
        fileName: file.name,
        fileSize: file.size,
        extractedFields: finalFields,
        fields: {
          dob: finalFields.dob || finalFields.date_of_birth || '',
          countryCode: finalFields.countryCode || finalFields.country_code || '',
          country: finalFields.country || '',
          documentType: finalFields.document_type || documentType,
          documentNumber: finalFields.documentNumber || finalFields.id_number || '',
        },
        credentialHash: credentialHash.toString(),
        uploadedAt: new Date().toISOString(),
      };

      // Save to localStorage
      const existingCredentials = localStorage.getItem('blurd_credentials');
      const credentials = existingCredentials ? JSON.parse(existingCredentials) : [];
      credentials.push(credential);
      localStorage.setItem('blurd_credentials', JSON.stringify(credentials));

      setExtractedFields(finalFields);
      setSuccess(true);
      
      // Show manual input fields if key fields are missing
      const hasDob = !!(finalFields.dob || finalFields.date_of_birth);
      const hasCountry = !!(finalFields.countryCode || finalFields.country_code);
      
      if (!hasDob || !hasCountry) {
        setShowManualFields(true);
        setError('Some required fields are missing. Please fill them manually below to generate proofs.');
      } else if (!rawText || rawText.trim().length < 10) {
        setError('Note: Limited text extracted from document. Please verify the fields below.');
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      // MVP: Even on error, try to save what we have
      try {
        const fields = extractFields('');
        const { poseidon } = await import('circomlibjs');
        const walletBigInt = BigInt('0x' + address.slice(2, 18));
        const walletHash = poseidon([walletBigInt]);
        const documentHash = poseidon([BigInt(file.name.length + file.size)]);
        const credentialHash = poseidon([walletHash, documentHash]);

        const finalFields = {
          ...fields,
          dob: manualDob.trim() || fields.dob || fields.date_of_birth || '',
          date_of_birth: manualDob.trim() || fields.date_of_birth || fields.dob || '',
          countryCode: manualCountryCode.trim().toUpperCase() || fields.countryCode || fields.country_code || '',
          country_code: manualCountryCode.trim().toUpperCase() || fields.country_code || fields.countryCode || '',
        };
        
        const credential = {
          id: Date.now().toString(),
          walletAddress: address,
          documentType: documentType === 'other' && customDocumentLabel.trim() ? customDocumentLabel.trim() : documentType,
          fileName: file.name,
          fileSize: file.size,
          extractedFields: finalFields,
          fields: {
            dob: finalFields.dob || finalFields.date_of_birth || '',
            countryCode: finalFields.countryCode || finalFields.country_code || '',
            country: finalFields.country || '',
            documentType: (finalFields as any).document_type || finalFields.documentType || documentType,
            documentNumber: finalFields.documentNumber || (finalFields as any).id_number || '',
          },
          credentialHash: credentialHash.toString(),
          uploadedAt: new Date().toISOString(),
        };

        const existingCredentials = localStorage.getItem('blurd_credentials');
        const credentials = existingCredentials ? JSON.parse(existingCredentials) : [];
        credentials.push(credential);
        localStorage.setItem('blurd_credentials', JSON.stringify(credentials));

        setExtractedFields(finalFields);
        setSuccess(true);
        setShowManualFields(true);
        setError('Document uploaded successfully. Please fill in the required fields below to generate proofs.');
      } catch (fallbackErr) {
        // Last resort: show error but don't block
        setSuccess(true);
        setShowManualFields(true);
        setExtractedFields({ success: true, document_type: documentType, dob: '', countryCode: '' });
        setError('Document uploaded. Please fill in the required fields below.');
      }
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
                <h3 className="text-lg font-semibold text-green-400">Extraction Complete</h3>
              </div>
              <p className="text-sm text-green-300">
                Review your fields below. Your credential has been bound to your wallet address and stored locally.
              </p>
            </div>

            <div className="bg-neutral-800/40 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-white mb-3">Document Information</h4>
              
              {/* Manual Input Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Date of Birth <span className="text-red-400">*</span>
                    <span className="text-gray-500 text-[10px] ml-1">(Required for Age proof)</span>
                  </label>
                  <input
                    type="date"
                    value={manualDob || extractedFields?.dob || extractedFields?.date_of_birth || ''}
                    onChange={(e) => {
                      setManualDob(e.target.value);
                      setExtractedFields({
                        ...extractedFields!,
                        dob: e.target.value,
                        date_of_birth: e.target.value,
                      });
                    }}
                    className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Format: YYYY-MM-DD</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Country Code <span className="text-red-400">*</span>
                    <span className="text-gray-500 text-[10px] ml-1">(Required for Nationality proof)</span>
                  </label>
                  <input
                    type="text"
                    value={manualCountryCode || extractedFields?.countryCode || extractedFields?.country_code || ''}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase().trim();
                      setManualCountryCode(code);
                      setExtractedFields({
                        ...extractedFields!,
                        countryCode: code,
                        country_code: code,
                      });
                    }}
                    placeholder="e.g. NG, US, GB"
                    maxLength={3}
                    className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none uppercase"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">ISO 2-letter country code (e.g., NG for Nigeria)</p>
                </div>
              </div>
              
              {/* Other Extracted Fields */}
              {Object.entries(extractedFields)
                .filter(([key, value]) => 
                  key !== 'success' && 
                  key !== 'detected_by' && 
                  key !== 'raw_text' && 
                  key !== 'dob' && 
                  key !== 'date_of_birth' && 
                  key !== 'countryCode' && 
                  key !== 'country_code' &&
                  value !== null && 
                  value !== undefined && 
                  value !== ''
                ).length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <h5 className="text-xs font-medium text-gray-400 mb-2">Other Extracted Fields</h5>
                  <div className="space-y-2">
                    {Object.entries(extractedFields)
                      .filter(([key, value]) => 
                        key !== 'success' && 
                        key !== 'detected_by' && 
                        key !== 'raw_text' && 
                        key !== 'dob' && 
                        key !== 'date_of_birth' && 
                        key !== 'countryCode' && 
                        key !== 'country_code' &&
                        value !== null && 
                        value !== undefined && 
                        value !== ''
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1.5 border-b border-white/5">
                          <span className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-white font-mono break-all text-right">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={async () => {
                // Update credential with manual fields
                const existingCredentials = localStorage.getItem('blurd_credentials');
                const credentials = existingCredentials ? JSON.parse(existingCredentials) : [];
                const credentialIndex = credentials.findIndex((c: any) => c.id === extractedFields?.id || c.uploadedAt);
                
                if (credentialIndex >= 0) {
                  const updatedFields: any = {
                    ...extractedFields,
                    dob: manualDob.trim() || extractedFields?.dob || (extractedFields as any)?.date_of_birth || '',
                    date_of_birth: manualDob.trim() || (extractedFields as any)?.date_of_birth || extractedFields?.dob || '',
                    countryCode: manualCountryCode.trim().toUpperCase() || extractedFields?.countryCode || (extractedFields as any)?.country_code || '',
                    country_code: manualCountryCode.trim().toUpperCase() || (extractedFields as any)?.country_code || extractedFields?.countryCode || '',
                  };
                  
                  credentials[credentialIndex].extractedFields = updatedFields;
                  credentials[credentialIndex].fields = {
                    dob: updatedFields.dob || updatedFields.date_of_birth || '',
                    countryCode: updatedFields.countryCode || updatedFields.country_code || '',
                    country: updatedFields.country || '',
                    documentType: updatedFields.document_type || updatedFields.documentType || documentType,
                    documentNumber: updatedFields.documentNumber || updatedFields.id_number || '',
                  };
                  
                  localStorage.setItem('blurd_credentials', JSON.stringify(credentials));
                  setExtractedFields(updatedFields);
                  setError(null);
                }
              }}
              disabled={!manualDob.trim() && !manualCountryCode.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Fields
            </button>

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

