'use client';

import { Shield, CheckCircle2, Download, Copy } from 'lucide-react';
import { useState } from 'react';

/**
 * ZK Proof Attached Screen Component
 * Displays proof type, proof hash, and download option
 * Integrates seamlessly with Send Payment screen
 */
interface ZKProofAttachedProps {
  proofType: 'age' | 'nationality' | 'uniqueness';
  proofHash: string;
  onDownload?: () => void;
}

export default function ZKProofAttached({ proofType, proofHash, onDownload }: ZKProofAttachedProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(proofHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default: create a JSON file with proof info
      const proofData = {
        type: proofType,
        proofHash,
        attachedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proof_${proofType}_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getProofTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      age: 'Age 18+ Verification',
      nationality: 'Nationality Verification',
      uniqueness: 'Human Uniqueness Proof',
    };
    return labels[type] || type;
  };

  const getProofTypeColorClasses = (type: string) => {
    const classes = {
      age: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        bgLight: 'bg-blue-500/10',
        borderLight: 'border-blue-500/20',
      },
      nationality: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        bgLight: 'bg-purple-500/10',
        borderLight: 'border-purple-500/20',
      },
      uniqueness: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/30',
        text: 'text-green-400',
        bgLight: 'bg-green-500/10',
        borderLight: 'border-green-500/20',
      },
    };
    return classes[type as keyof typeof classes] || classes.age;
  };

  const colorClasses = getProofTypeColorClasses(proofType);

  return (
    <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 shadow-xl">
      {/* Success Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClasses.bg} ${colorClasses.border} border`}>
          <CheckCircle2 className={`h-6 w-6 ${colorClasses.text}`} />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-white">Proof Attached Successfully</h3>
          <p className="text-sm text-gray-400">Your ZK identity proof is ready</p>
        </div>
      </div>

      {/* Proof Type */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 mb-2">Proof Type</label>
        <div className={`flex items-center space-x-3 ${colorClasses.bgLight} rounded-lg p-4 ${colorClasses.borderLight} border`}>
          <Shield className={`h-5 w-5 ${colorClasses.text}`} />
          <p className="text-sm font-semibold text-white">{getProofTypeLabel(proofType)}</p>
        </div>
      </div>

      {/* Proof Hash */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 mb-2">Proof Hash</label>
        <div className="flex items-center space-x-3 bg-neutral-800/50 rounded-lg p-4 border border-white/5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-white break-all">{proofHash}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {proofHash.substring(0, 10)}…{proofHash.substring(proofHash.length - 8)}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors"
            title="Copy proof hash"
          >
            {copied ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        <Download className="h-5 w-5" />
        <span>Download Proof JSON</span>
      </button>

      {/* Privacy Note */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          This proof hash will be stored on-chain when you send a payment. No personal data is exposed.
        </p>
      </div>
    </div>
  );
}

