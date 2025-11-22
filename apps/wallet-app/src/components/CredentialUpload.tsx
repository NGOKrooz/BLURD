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
      const fields = extractFields(ocrText);

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
    <div className="space-y-4">
      {/* File Upload Area */}
      {!file ? (
        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-400 mb-2">
            Drag and drop your ID document here, or click to browse
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Choose File
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Supported: JPEG, PNG
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center justify-between p-4 bg-neutral-900/40 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2">
              {file.type.startsWith('image/') ? (
                <Image className="h-6 w-6 text-blue-400" aria-label="Image file" />
              ) : (
                <File className="h-6 w-6 text-blue-400" aria-label="File" />
              )}
              <span className="text-sm text-white">{file.name}</span>
            </div>
            <button
              onClick={handleReset}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Extraction Status */}
          {extracting ? (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">{progressText}</p>
            </div>
          ) : Object.keys(extractedFields).length > 0 ? (
            <div className="space-y-3 p-4 bg-neutral-900/40 rounded-lg border border-white/10">
              <p className="text-xs font-semibold text-green-400 mb-3">Extracted Details:</p>
              
              {/* Date of Birth */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Date of Birth:</span>
                {extractedFields.dob ? (
                  <span className="text-xs text-green-300">{formatDate(extractedFields.dob)}</span>
                ) : (
                  <span className="text-xs text-yellow-400">Not detected</span>
                )}
              </div>

              {/* Age */}
              {extractedFields.age !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Age:</span>
                  <span className="text-xs text-green-300">{extractedFields.age}</span>
                </div>
              )}

              {/* Country */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Country:</span>
                {extractedFields.country ? (
                  <span className="text-xs text-green-300">
                    {extractedFields.country} {extractedFields.countryCode && `(${extractedFields.countryCode})`}
                  </span>
                ) : (
                  <span className="text-xs text-yellow-400">Not detected</span>
                )}
              </div>

              {/* Nationality */}
              {extractedFields.nationality && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Nationality:</span>
                  <span className="text-xs text-green-300">{extractedFields.nationality}</span>
                </div>
              )}

              {/* Document Number */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Document Number:</span>
                {extractedFields.documentNumber ? (
                  <span className="text-xs text-green-300 font-mono">{extractedFields.documentNumber}</span>
                ) : (
                  <span className="text-xs text-yellow-400">Not detected</span>
                )}
              </div>

              {/* Valid Until */}
              {extractedFields.expiry && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Valid Until:</span>
                  <span className="text-xs text-green-300">{formatDate(extractedFields.expiry)}</span>
                </div>
              )}

              {/* Retry Button */}
              <button
                onClick={handleReset}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Upload Another Document</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-300">
                No details could be extracted. Please ensure the document is clear and contains visible text.
              </p>
              <button
                onClick={handleReset}
                className="mt-3 text-xs text-yellow-400 hover:text-yellow-300"
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
