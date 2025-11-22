'use client';

import { useState, useRef } from 'react';
import { Upload, File, Image, X, RefreshCw } from 'lucide-react';
import { simpleOCR } from '@/utils/simpleOCR';
import { extractFields, type ExtractedFields } from '@/utils/extractFields';

interface CredentialUploadProps {
  onExtract: (fields: ExtractedFields) => void;
  onError: (error: string, showRetry?: boolean) => void;
}

export default function CredentialUpload({ onExtract, onError }: CredentialUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progressText, setProgressText] = useState('Extracting details…');
  const [extractedFields, setExtractedFields] = useState<ExtractedFields>({});
  const [documentType, setDocumentType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      onError('Please upload a valid image file (JPEG/PNG)');
      return;
    }

    setFile(selectedFile);
    setExtractedFields({});
    await extractWithOCR(selectedFile);
  };

  const extractWithOCR = async (imageFile: File) => {
    setExtracting(true);
    setProgressText('Extracting details…');

    try {
      // Step 1: Simple OCR - no preprocessing, no filters
      const ocrText = await simpleOCR(imageFile);
      
      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('No text found in document. Please ensure the image is clear.');
      }

      // Step 2: Extract fields using simple extractor
      setProgressText('Processing extracted text…');
      
      // Log OCR text for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('OCR Text extracted:', ocrText.substring(0, 500)); // First 500 chars
      }
      
      const fields = extractFields(ocrText);
      
      // Log extracted fields for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Extracted fields:', fields);
      }
      
      // Add document type to fields
      if (documentType) {
        fields.documentType = documentType;
      }

      // Step 3: Set extracted fields and notify parent
      setExtractedFields(fields);
      onExtract(fields);
    } catch (error: any) {
      console.error('Extraction error:', error);
      onError(error.message || 'Failed to extract document details', true);
      setExtractedFields({});
    } finally {
      setExtracting(false);
      setProgressText('Extraction complete');
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedFields({});
    setDocumentType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (isoDate?: string): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return isoDate;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Document Type Selection */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
          Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-neutral-900/40 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[44px]"
        >
          <option value="">Select document type...</option>
          <option value="passport">Passport</option>
          <option value="id_card">National ID Card</option>
          <option value="driver_license">Driver&apos;s License</option>
          <option value="voter_id">Voter ID</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* File Upload Area */}
      {!file ? (
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-6 sm:p-8 lg:p-12 text-center cursor-pointer hover:border-blue-500 transition-colors touch-manipulation"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-xs sm:text-sm text-gray-400 mb-2 px-2">
            Drag and drop your ID document here, or click to browse
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md hover:bg-blue-500/10 transition-colors touch-manipulation min-h-[44px]"
          >
            Choose File
          </button>
          <p className="text-xs text-gray-500 mt-3 sm:mt-4">
            Supported: JPEG, PNG
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-neutral-900/40 rounded-lg border border-white/10 gap-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              {file.type.startsWith('image/') ? (
                <Image className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0" aria-label="Image file" />
              ) : (
                <File className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0" aria-label="File" />
              )}
              <span className="text-xs sm:text-sm text-white truncate">{file.name}</span>
            </div>
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Extraction Status */}
          {extracting ? (
            <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg overflow-x-hidden">
              <p className="text-xs sm:text-sm text-blue-300 break-words">{progressText}</p>
            </div>
          ) : Object.keys(extractedFields).length > 0 ? (
            <div className="space-y-3 p-3 sm:p-4 bg-neutral-900/40 rounded-lg border border-white/10 overflow-x-hidden">
              <p className="text-xs font-semibold text-green-400 mb-3">Extracted Details:</p>
              
              {/* Date of Birth */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">Date of Birth:</span>
                {extractedFields.dob ? (
                  <span className="text-xs text-green-300 text-right break-words">{formatDate(extractedFields.dob)}</span>
                ) : (
                  <span className="text-xs text-yellow-400 text-right">Not detected</span>
                )}
              </div>

              {/* Age */}
              {extractedFields.age !== undefined && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">Age:</span>
                  <span className="text-xs text-green-300 text-right">{extractedFields.age}</span>
                </div>
              )}

              {/* Country */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">Country:</span>
                {extractedFields.country ? (
                  <span className="text-xs text-green-300 text-right break-words">
                    {extractedFields.country} {extractedFields.countryCode && `(${extractedFields.countryCode})`}
                  </span>
                ) : (
                  <span className="text-xs text-yellow-400 text-right">Not detected</span>
                )}
              </div>

              {/* Nationality */}
              {extractedFields.nationality && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">Nationality:</span>
                  <span className="text-xs text-green-300 text-right break-words">{extractedFields.nationality}</span>
                </div>
              )}

              {/* Document Number */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">Document Number:</span>
                {extractedFields.documentNumber ? (
                  <span className="text-xs text-green-300 font-mono text-right break-all">{extractedFields.documentNumber}</span>
                ) : (
                  <span className="text-xs text-yellow-400 text-right">Not detected</span>
                )}
              </div>

              {/* Valid Until */}
              {extractedFields.expiry && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">Valid Until:</span>
                  <span className="text-xs text-green-300 text-right break-words">{formatDate(extractedFields.expiry)}</span>
                </div>
              )}

              {/* Retry Button */}
              <button
                onClick={handleReset}
                className="w-full mt-3 sm:mt-4 flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors touch-manipulation min-h-[44px]"
              >
                <RefreshCw className="h-4 w-4 flex-shrink-0" />
                <span>Upload Another Document</span>
              </button>
            </div>
          ) : (
            <div className="p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg overflow-x-hidden">
              <p className="text-xs text-yellow-300 break-words mb-3">
                No details could be extracted. Please ensure the document is clear and contains visible text.
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-yellow-400 hover:text-yellow-300 touch-manipulation min-h-[44px] px-3 py-2 rounded-md hover:bg-yellow-500/10 transition-colors"
              >
                Try another document
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) {
            handleFileSelect(selectedFile);
          }
        }}
        className="hidden"
      />

      {/* Privacy Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-xs text-blue-300">
          🔒 <strong>Privacy:</strong> Processing is done locally. Document is processed in your browser and never uploaded.
        </p>
      </div>
    </div>
  );
}
