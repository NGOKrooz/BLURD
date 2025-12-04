'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Wallet, X, Info, Shield } from 'lucide-react';

export type ModalStatus = 'connecting' | 'generating' | 'success' | 'error' | null;

interface StatusModalProps {
  status: ModalStatus;
  onClose: () => void;
  errorMessage?: string;
  successMessage?: string;
  autoCloseDelay?: number;
}

/**
 * Dynamic Status Modal for Identity Proof Operations
 * Shows different states for wallet connection, proof generation, success, and errors
 */
export default function StatusModal({
  status,
  onClose,
  errorMessage,
  successMessage,
  autoCloseDelay = 0,
}: StatusModalProps) {
  useEffect(() => {
    if (status === 'success' && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [status, autoCloseDelay, onClose]);

  if (!status) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={status !== 'connecting' && status !== 'generating' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close button (not shown during loading states) */}
        {status !== 'connecting' && status !== 'generating' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Connecting State */}
        {status === 'connecting' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30 animate-pulse">
                  <Wallet className="h-10 w-10 text-blue-400" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Connecting Wallet</h2>
            <p className="text-sm text-gray-400">
              Please approve the connection in your wallet to establish your identity anchor...
            </p>
          </div>
        )}

        {/* Generating State */}
        {status === 'generating' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
                  <Shield className="h-10 w-10 text-purple-400" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Generating Proof</h2>
            <p className="text-sm text-gray-400 mb-4">
              Creating your zero-knowledge identity proof...
            </p>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-purple-300">
                🔒 Your identity data is processed locally and never leaves your device
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border-2 border-green-500/50 animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="mb-4 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg inline-block">
              <h2 className="text-lg sm:text-xl font-bold text-green-400">
                ✅ SUCCESS
              </h2>
            </div>

            <p className="text-sm text-gray-300 mb-6">
              {successMessage || 'Operation completed successfully'}
            </p>

            {/* Privacy Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300 text-left">
                  <strong>Privacy Protected:</strong> Your identity proof verifies claims without revealing any personal information.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 animate-in zoom-in duration-300">
                <XCircle className="h-12 w-12 text-red-400" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Operation Failed</h2>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-300">
                {errorMessage || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
