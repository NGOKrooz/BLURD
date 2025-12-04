'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X, Download, Shield, Lock } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  txHash?: string;
  commitment?: string;
  autoCloseDelay?: number; // milliseconds, 0 to disable auto-close
}

/**
 * Payment Success Modal
 * Shows confirmation of private payment with proof file download option
 */
export default function PaymentSuccessModal({
  isOpen,
  onClose,
  onDownload,
  txHash,
  commitment,
  autoCloseDelay = 10000, // 10 seconds default
}: PaymentSuccessModalProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen || autoCloseDelay <= 0) return;

    // Set initial countdown
    setCountdown(Math.floor(autoCloseDelay / 1000));

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
              <Lock className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">
          Payment Sent Privately! 🎉
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-300 text-center mb-6">
          Your payment was processed with full privacy protection. A proof file has been generated that you can share with merchants or platforms without revealing your identity.
        </p>

        {/* Privacy badge */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300 mb-1">Privacy Protected</p>
              <p className="text-xs text-blue-200/80">
                Your wallet address, transaction amount, and identity details are NOT included in the proof file. Only cryptographic commitments are shared.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction info (truncated) */}
        {txHash && (
          <div className="bg-neutral-800/50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
            <p className="text-xs font-mono text-gray-300 truncate">
              {txHash}
            </p>
          </div>
        )}

        {commitment && (
          <div className="bg-neutral-800/50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-400 mb-1">Commitment Hash</p>
            <p className="text-xs font-mono text-purple-300 truncate">
              {commitment}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onDownload && (
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download Proof File</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
          >
            Close {countdown > 0 && `(${countdown}s)`}
          </button>
        </div>

        {/* Auto-close indicator */}
        {countdown > 0 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            This dialog will close automatically in {countdown} seconds
          </p>
        )}
      </div>
    </div>
  );
}

