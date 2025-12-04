'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Shield, Key, Download, CheckCircle2, AlertCircle, User, Calendar, FileText, List, Plus, Eye, Trash2, RefreshCw, Globe, X, Info, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import WalletConnect from '@/components/WalletConnect';
import { generateAgeProof, generateCountryProof, downloadProof, storeProof, loadStoredProofs, ProofResult } from '@/lib/zk/proof';
import CredentialUpload from '@/components/CredentialUpload';
import { computeIdCommit, computeUniqueKey, computeUniqueKeyHash, generateNonce } from '@/lib/crypto';

type TabType = 'issue' | 'generate' | 'stored';

interface Credential {
  id: string;
  idCommit: string;
  uniqueKeyHash: string;
  fields: {
    dob: string;
    docType?: string;
    documentType?: string;
    expiry?: string;
    nonce: string;
    countryCode?: string;
    country?: string;
    documentNumber?: string;
    passportNumber?: string;
    serialNumber?: string;
    voterNumber?: string;
  };
  issuedAt: string;
  walletAddress?: string;
}

export default function MyProofs() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('issue');
  const [mounted, setMounted] = useState(false);
  const [highlightedProofId, setHighlightedProofId] = useState<string | null>(null);
  
  // Issue New Proof State
  const [extractedFields, setExtractedFields] = useState<any>({});
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(false);
  
  // Generate from Credential State
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [proofType, setProofType] = useState<'age18' | 'country' | null>(null);
  const [userAge, setUserAge] = useState('');
  const [userCountryCode, setUserCountryCode] = useState('');
  const [requiredCountryCode, setRequiredCountryCode] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<{
    type: 'age18' | 'country';
    dob?: string;
    age?: number;
    countryCode?: string;
    country?: string;
    countryNumeric?: number;
  } | null>(null);
  
  // Auto-fill requiredCountryCode from selected credential when nationality proof is selected
  useEffect(() => {
    if (proofType === 'country' && selectedCredential?.fields?.countryCode) {
      setRequiredCountryCode(selectedCredential.fields.countryCode.toUpperCase());
    }
  }, [proofType, selectedCredential]);

  // Calculate age from DOB
  // DOB format can be ISO (YYYY-MM-DD) or MM/DD/YYYY
  const calculateAgeFromDOB = (dob: string): { age: number; is18Plus: boolean; dobDate: Date | null } => {
    if (!dob) return { age: 0, is18Plus: false, dobDate: null };
    
    try {
      let dobDate: Date | null = null;
      
      // Try ISO format first (YYYY-MM-DD)
      if (dob.includes('-') && dob.split('-').length === 3) {
        dobDate = new Date(dob);
      }
      // Try MM/DD/YYYY format
      else if (dob.includes('/')) {
        const parts = dob.split('/');
        if (parts.length === 3) {
          // Check if first part > 12 (likely DD/MM/YYYY)
          if (parseInt(parts[0], 10) > 12) {
            // DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[2], 10);
            dobDate = new Date(year, month, day);
          } else {
            // MM/DD/YYYY
            const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            dobDate = new Date(year, month, day);
          }
        }
      }
      
      // Fallback: try direct Date parsing
      if (!dobDate || isNaN(dobDate.getTime())) {
        dobDate = new Date(dob);
      }
      
      if (!dobDate || isNaN(dobDate.getTime())) {
        return { age: 0, is18Plus: false, dobDate: null };
      }
      
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      const dayDiff = today.getDate() - dobDate.getDate();
      
      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }
      
      const is18Plus = age >= 18;
      
      return { age, is18Plus, dobDate };
    } catch (error) {
      console.error('Error calculating age from DOB:', error);
      return { age: 0, is18Plus: false, dobDate: null };
    }
  };

  // Get age info from selected credential
  const ageInfo = selectedCredential?.fields?.dob 
    ? calculateAgeFromDOB(selectedCredential.fields.dob)
    : { age: 0, is18Plus: false, dobDate: null };
  const [generating, setGenerating] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<ProofResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0); // Key to reset CredentialUpload component
  
  // Stored Proofs State
  const [storedProofs, setStoredProofs] = useState<ProofResult[]>([]);
  
  // Merchant verification is handled in the merchant app – no verification UI in wallet app

  useEffect(() => {
    setMounted(true);
    loadCredentials();
    loadStoredProofsList();
    
    // Check for proof query parameter and switch to stored tab
    const proofId = searchParams.get('proof');
    if (proofId) {
      setHighlightedProofId(proofId);
      setActiveTab('stored');
      // Scroll to proof after a short delay to allow rendering
      setTimeout(() => {
        const proofElement = document.getElementById(`proof-${proofId}`);
        if (proofElement) {
          proofElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadCredentials = () => {
    const stored = localStorage.getItem('blurd_credentials');
    if (stored) {
      const creds = JSON.parse(stored);
      setCredentials(creds);
      if (creds.length > 0 && !selectedCredential) {
        setSelectedCredential(creds[0]);
      }
    }
  };

  const loadStoredProofsList = () => {
    try {
      const proofs = loadStoredProofs();
      console.log('Loaded proofs:', proofs);
      setStoredProofs(proofs || []);
    } catch (error) {
      console.error('Error loading proofs:', error);
      setStoredProofs([]);
    }
  };

  // Issue New Proof Handler
  const handleIssueNew = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    // Check if DOB is valid (not empty or just whitespace)
    const dobValid = (extractedFields.date_of_birth || extractedFields.dob) && 
                     (extractedFields.date_of_birth || extractedFields.dob)?.trim().length > 0;
    
    if (!dobValid) {
      alert('Please upload and extract Date of Birth from your ID document first.');
      return;
    }

    // Show success immediately
    setIssued(true);
    setIssuing(true);
    
    try {
      const nonce = generateNonce();
      const commit = await computeIdCommit({ ...extractedFields, nonce });
      const uniqueKey = await computeUniqueKey(commit, address);
      const hash = await computeUniqueKeyHash(uniqueKey);

      const credential: Credential = {
        id: Date.now().toString(),
        idCommit: commit,
        uniqueKeyHash: hash,
        fields: { 
          ...extractedFields, 
          nonce,
          documentType: extractedFields.document_type || extractedFields.documentType || 'unknown',
          docType: extractedFields.document_type || extractedFields.documentType || 'unknown',
        },
        issuedAt: new Date().toISOString(),
        walletAddress: address,
      };

      const stored = localStorage.getItem('blurd_credentials');
      const creds = stored ? JSON.parse(stored) : [];
      creds.push(credential);
      localStorage.setItem('blurd_credentials', JSON.stringify(creds));

      loadCredentials();
      // Reset form and clear upload
      setExtractedFields({});
      setUploadKey(prev => prev + 1); // Reset CredentialUpload component
    } catch (error: any) {
      setIssued(false);
      alert('Failed to issue credential: ' + error.message);
    } finally {
      setIssuing(false);
    }
  };

  // Generate Proof from Credential
  const handleGenerateFromCredential = async () => {
    if (!selectedCredential || !proofType) return;

    if (proofType === 'age18') {
      if (!selectedCredential.fields?.dob) {
        alert('Selected credential does not have a date of birth');
        return;
      }
      if (!ageInfo.is18Plus) {
        alert('You must be 18 or older to generate an age proof');
        return;
      }
    }

    // For country proof, use country code from selected credential
    if (proofType === 'country') {
      if (!selectedCredential?.fields?.countryCode) {
        alert('Please select a credential first to get your country code');
        setGenerating(false);
        return;
      }
      // Auto-set both userCountryCode and requiredCountryCode from selected credential
      const countryCode = selectedCredential.fields.countryCode.toUpperCase();
      setUserCountryCode(countryCode);
      setRequiredCountryCode(countryCode);
    }

    // Prepare preview data
    let preview: typeof previewData = null;
    
    if (proofType === 'age18') {
      if (!ageInfo.is18Plus || ageInfo.age === 0) {
        alert('Age calculation failed or user is under 18');
        return;
      }
      const ageNum = Number(ageInfo.age);
      if (!Number.isInteger(ageNum) || ageNum < 18) {
        alert(`Invalid age: ${ageNum}. Must be 18 or older.`);
        return;
      }
      preview = {
        type: 'age18',
        dob: selectedCredential?.fields?.dob,
        age: ageNum,
      };
    } else if (proofType === 'country') {
      const countryCode = selectedCredential?.fields?.countryCode?.toUpperCase();
      if (!countryCode) {
        alert('Please select a credential with a country code');
        return;
      }
      preview = {
        type: 'country',
        countryCode: countryCode,
        country: selectedCredential?.fields?.country,
      };
    }
    
    // Show preview modal
    if (preview) {
      setPreviewData(preview);
      setShowPreviewModal(true);
      return; // Wait for user confirmation
    }
    
    // Should not reach here
    alert('Unable to prepare preview data');
  };

  // Generate proof after confirmation
  const generateProofConfirmed = async () => {
    if (!selectedCredential || !proofType || !previewData) return;
    
    setGenerating(true);
    setShowPreviewModal(false);
    
    try {
      let result: ProofResult;
      
      if (proofType === 'age18' && previewData.age) {
        result = await generateAgeProof(previewData.age, 18);
      } else if (proofType === 'country' && previewData.countryCode) {
        result = await generateCountryProof(previewData.countryCode, previewData.countryCode);
      } else {
        throw new Error('Invalid proof type or missing data');
      }

      setGeneratedProof(result);
      storeProof(result);
      console.log('Proof stored, reloading list...');
      loadStoredProofsList();
      
      // Clear preview data
      setPreviewData(null);
      
      // If user is on stored tab, refresh it
      if (activeTab === 'stored') {
        setTimeout(() => {
          loadStoredProofsList();
        }, 100);
      }
    } catch (error: any) {
      console.error('Proof generation error:', error);
      setPreviewData(null);
      const errorMessage = error.message || 'Unknown error occurred';
      
      // Show detailed error message to user
      if (errorMessage.includes('circuit files are missing') || errorMessage.includes('missing')) {
        alert(`❌ Circuit Files Missing\n\n${errorMessage}\n\nPlease run the setup script to generate the required circuit files.`);
      } else if (errorMessage.includes('too many value') || errorMessage.includes('too many')) {
        alert(`❌ Input Format Error\n\n${errorMessage}\n\nThis usually means the input format is incorrect. Please check the values and try again.`);
      } else {
        alert(`❌ Failed to generate proof\n\n${errorMessage}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Verification flow is provided in the merchant app only – no on-chain verification in the wallet UI

  // Prevent hydration mismatch by not rendering client-side content until mounted
  if (!mounted) {
    return (
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
        <div className="mb-4 sm:mb-6">
          <Link href="/" className="text-xs sm:text-sm text-gray-400 hover:text-white">
            Back to Dashboard
          </Link>
        </div>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">My Proofs</h1>
          <p className="text-xs sm:text-sm text-gray-400">Manage your zero-knowledge identity proofs</p>
        </div>
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6 sm:p-8">
          <div className="text-center py-8">
            <p className="text-xs sm:text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <Link href="/" className="text-xs sm:text-sm text-gray-400 hover:text-white">
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">My Proofs</h1>
        <p className="text-xs sm:text-sm text-gray-400">Manage your zero-knowledge identity proofs</p>
      </div>

      {!isConnected && (
        <div className="mb-4 sm:mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-yellow-300 mb-1 sm:mb-2">Connect your wallet to use proof features</p>
            </div>
            <div className="flex-shrink-0">
              <WalletConnect />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 sm:mb-6 border-b border-white/10 overflow-x-auto">
        <div className="flex space-x-1 min-w-max sm:min-w-0 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('issue')}
            className={`px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] touch-manipulation ${
              activeTab === 'issue'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Issue New Proof
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] touch-manipulation ${
              activeTab === 'generate'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Generate from Credential
          </button>
          <button
            onClick={() => {
              setActiveTab('stored');
              loadStoredProofsList();
            }}
            className={`px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] touch-manipulation ${
              activeTab === 'stored'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Stored Proofs
            {mounted && storedProofs.length > 0 && (
              <span className="ml-1.5 sm:ml-2 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                {storedProofs.length}
              </span>
            )}
          </button>
          {/* Merchant-side verification lives in the merchant app, so we only show Issue / Generate / Stored here */}
        </div>
      </div>

      {/* Issue New Proof Tab */}
      {activeTab === 'issue' && (
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {issued ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-semibold text-white mb-2">✅ Credential Issued Successfully!</h2>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-300 mb-2">
                  <strong>Your credential has been stored locally</strong>
                </p>
                <p className="text-xs text-green-200 mt-2">
                  🔒 <strong>ID Document Deleted:</strong> Your uploaded document has been permanently deleted from your device. Only the extracted data and cryptographic hashes have been stored.
                </p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-300">
                  💡 Next step: Go to the <strong>&quot;Generate from Credential&quot;</strong> tab to create proofs from this credential.
                </p>
              </div>
              <button
                onClick={() => {
                  setIssued(false);
                  setExtractedFields({});
                  setUploadKey(prev => prev + 1); // Reset CredentialUpload component
                }}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Issue Another Credential
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Upload ID Document</h2>
                <CredentialUpload
                  key={uploadKey}
                  onExtract={(fields) => {
                    setExtractedFields(fields);
                    setError(null);
                  }}
                  onError={(error, showRetry) => {
                    setError(error);
                    if (showRetry) {
                      // Show retry options
                    }
                  }}
                />
                {error && (
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-300 mb-2">
                          OCR Processing Failed
                        </p>
                        <p className="text-xs text-yellow-200 mb-3">{error}</p>
                        <div className="space-y-2">
                          <p className="text-xs text-yellow-200 font-semibold">Secure Options:</p>
                          <button
                            onClick={() => {
                              setError(null);
                              setUploadKey(prev => prev + 1); // Reset CredentialUpload component
                              setExtractedFields({});
                            }}
                            className="w-full flex items-center justify-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry Upload / Try Another File</span>
                          </button>
                          <p className="text-xs text-yellow-200/80 text-center mt-2">
                            Or use alternative trusted verifier (third-party KYC)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              <button
                onClick={handleIssueNew}
                disabled={
                  issuing || 
                  !(extractedFields.date_of_birth || extractedFields.dob)?.trim()
                }
                className={`w-full rounded-md px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-white transition-all flex items-center justify-center space-x-2 touch-manipulation ${
                  issuing || !extractedFields.dob?.trim()
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
                style={{ 
                  minHeight: '44px',
                  cursor: issuing || !extractedFields.dob?.trim()
                    ? 'not-allowed' 
                    : 'pointer'
                }}
                title={
                  !(extractedFields.date_of_birth || extractedFields.dob)?.trim()
                    ? 'Please upload and extract Date of Birth from your ID document.'
                    : 'Click to issue credential from extracted fields'
                }
              >
                <Shield className="h-4 w-4" />
                <span>
                  {issuing 
                    ? 'Issuing Credential...' 
                    : 'Issue New Proof'
                  }
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generate from Credential Tab */}
      {activeTab === 'generate' && (
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {generatedProof ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-sm text-green-300">Proof generated successfully</p>
              </div>
              <div className="bg-neutral-800/40 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Proof Hash:</p>
                <p className="text-xs text-blue-400 font-mono break-all">{generatedProof.proofHash}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadProof(generatedProof)}
                  className="flex-1 flex items-center justify-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download proof.json</span>
                </button>
                <button
                  onClick={() => {
                    setGeneratedProof(null);
                    setProofType(null);
                    setUserAge('');
                    setUserCountryCode('');
                    setRequiredCountryCode('');
                  }}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Generate Another
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {credentials.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-400 mb-4">No credentials found</p>
                  <button
                    onClick={() => setActiveTab('issue')}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Issue a credential first
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Credential</label>
                    <select
                      value={selectedCredential?.id || ''}
                      onChange={(e) => {
                        const cred = credentials.find(c => c.id === e.target.value);
                        setSelectedCredential(cred || null);
                      }}
                      className="block w-full rounded-md border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none [&>option]:bg-neutral-900 [&>option]:text-white"
                    >
                      {credentials.map((cred) => {
                        const docType = cred.fields.documentType || cred.fields.docType || 'Unknown';
                        const docTypeDisplay = docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return (
                          <option key={cred.id} value={cred.id}>
                            {docTypeDisplay} - {new Date(cred.issuedAt).toLocaleDateString()}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">Choose Proof Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      <button
                        onClick={() => setProofType('age18')}
                        className={`p-4 sm:p-6 rounded-lg border transition-colors text-left touch-manipulation min-h-[100px] ${
                          proofType === 'age18'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <Calendar className="h-5 w-5 text-blue-400 flex-shrink-0" />
                          <span className="font-semibold text-white text-sm sm:text-base">Age Verification</span>
                        </div>
                        <p className="text-xs text-gray-400">Prove you are 18 or older</p>
                      </button>

                      <button
                        onClick={() => setProofType('country')}
                        className={`p-4 sm:p-6 rounded-lg border transition-colors text-left touch-manipulation min-h-[100px] ${
                          proofType === 'country'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <Globe className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="font-semibold text-white text-sm sm:text-base">Nationality</span>
                        </div>
                        <p className="text-xs text-gray-400">Prove country membership</p>
                      </button>

                    </div>
                  </div>

                  {proofType === 'age18' && (
                    <div>
                      {selectedCredential?.fields?.dob ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                            <p className="text-sm font-medium text-green-400 mb-2">
                              <CheckCircle2 className="h-4 w-4 inline-block mr-1" />
                              Date of Birth from Selected Credential
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {selectedCredential.fields.dob}
                            </p>
                          </div>
                          
                          {ageInfo.age > 0 && (
                            <div className={`p-3 border rounded-md ${
                              ageInfo.is18Plus 
                                ? 'bg-green-500/10 border-green-500/20' 
                                : 'bg-red-500/10 border-red-500/20'
                            }`}>
                              <div className="flex items-center space-x-2">
                                {ageInfo.is18Plus ? (
                                  <>
                                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                                    <div>
                                      <p className="text-sm font-semibold text-green-400">
                                        Verified 18+
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        Age: {ageInfo.age} years
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <X className="h-5 w-5 text-red-400" />
                                    <div>
                                      <p className="text-sm font-semibold text-red-400">
                                        Under 18
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        Age: {ageInfo.age} years
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                          <p className="text-sm text-yellow-400">
                            ⚠️ Please select a credential with a date of birth first
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {proofType === 'country' && (
                    <div>
                      {selectedCredential?.fields?.countryCode ? (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                          <p className="text-sm font-medium text-green-400 mb-1">
                            ✓ Country from Selected Credential
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {selectedCredential.fields.countryCode.toUpperCase()}
                            {selectedCredential.fields.country && (
                              <span className="text-sm text-gray-400 ml-2">
                                ({selectedCredential.fields.country})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Your country code will be used automatically for this proof
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                          <p className="text-sm text-yellow-400">
                            ⚠️ Please select a credential first to get your country code
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateFromCredential}
                    disabled={
                      generating || 
                      !proofType || 
                      (proofType === 'age18' && (!selectedCredential?.fields?.dob || !ageInfo.is18Plus)) ||
                      (proofType === 'country' && !selectedCredential?.fields?.countryCode)
                    }
                    className={`w-full rounded-md px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-white transition-colors flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] ${
                      generating || 
                      !proofType || 
                      (proofType === 'age18' && (!selectedCredential?.fields?.dob || !ageInfo.is18Plus)) ||
                      (proofType === 'country' && !selectedCredential?.fields?.countryCode)
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{generating ? 'Generating Proof...' : 'Generate Proof'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* My Stored Proofs Tab */}
      {activeTab === 'stored' && (
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">My Stored Proofs</h2>
            <button
              onClick={loadStoredProofsList}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Refresh
            </button>
          </div>
          {storedProofs.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-400 mb-4">No proofs generated yet</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Generate your first proof
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {storedProofs.map((proof, index) => {
                const proofId = (proof as any).id || `proof-${index}`;
                const isHighlighted = highlightedProofId === proofId;
                return (
                <div
                  key={index}
                  id={`proof-${proofId}`}
                  className={`bg-neutral-800/40 rounded-lg border p-6 transition-all ${
                    isHighlighted 
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Shield className="h-5 w-5 text-blue-400" />
                        <div>
                          <h3 className="text-base font-semibold text-white capitalize">{proof.circuitType}</h3>
                          <p className="text-xs text-gray-400">
                            {proof.generatedAt ? new Date(proof.generatedAt).toLocaleString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-neutral-900/40 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-400 mb-1">Proof Hash:</p>
                        <p className="text-xs text-blue-400 font-mono break-all">{proof.proofHash}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadProof(proof)}
                        className="p-2 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const updated = storedProofs.filter((_, i) => i !== index);
                          localStorage.setItem('blurd_proofs', JSON.stringify(updated));
                          loadStoredProofsList();
                        }}
                        className="p-2 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-white/20 rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto my-auto shadow-xl overflow-x-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-400" />
                <span>Confirm Proof Generation</span>
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewData(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-400 mb-3 font-medium">
                  Extracted Data Preview:
                </p>
                
                {previewData.type === 'age18' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Date of Birth:</span>
                      <span className="text-white font-semibold">{previewData.dob || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Age:</span>
                      <span className="text-white font-semibold">{previewData.age} years</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-gray-400 text-sm">Status:</span>
                      <span className="text-green-400 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verified 18+</span>
                      </span>
                    </div>
                  </div>
                )}
                
                {previewData.type === 'country' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Country Code:</span>
                      <span className="text-white font-semibold">{previewData.countryCode || 'N/A'}</span>
                    </div>
                    {previewData.country && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Country:</span>
                        <span className="text-white font-semibold">{previewData.country}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-300">
                  ⚠️ Please verify the data above is correct before generating the proof.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewData(null);
                }}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm font-semibold touch-manipulation min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={generateProofConfirmed}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Generate Proof</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

