'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Wallet, X, ExternalLink, Info, Shield, Lock } from 'lucide-react';

export type ModalStatus = 'connecting' | 'sending' | 'success' | 'error' | null;

interface StatusModalProps {
  status: ModalStatus;
  onClose: () => void;
  txHash?: string;
  contractAddress?: string;
  errorMessage?: string;
  autoCloseDelay?: number;
}

/**
 * Dynamic Status Modal
 * Shows different states for wallet connection, payment, success, and errors
 */
export default function StatusModal({
  status,
  onClose,
  txHash,
  contractAddress,
  errorMessage,
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

  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getExplorerTxUrl = (hash: string) => 
    `https://sepolia.etherscan.io/tx/${hash}`;
  
  const getExplorerContractUrl = (address: string) => 
    `https://sepolia.etherscan.io/address/${address}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={status !== 'connecting' && status !== 'sending' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close button (not shown during loading states) */}
        {status !== 'connecting' && status !== 'sending' && (
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
              Please approve the connection in your wallet...
            </p>
          </div>
        )}

        {/* Sending State */}
        {status === 'sending' && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
                  <Lock className="h-10 w-10 text-purple-400" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sending Private Payment</h2>
            <p className="text-sm text-gray-400 mb-4">
              Your transaction is being processed securely...
            </p>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-purple-300">
                🔒 Your payment details are encrypted using a commitment hash
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
                ✅ OPERATION SUCCESSFUL
              </h2>
            </div>

            <p className="text-sm text-gray-300 mb-6">
              Your operation has been confirmed on the network.
            </p>

            {/* Transaction Details */}
            <div className="space-y-3 mb-6">
              {txHash && (
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Transaction Hash</span>
                    <a
                      href={getExplorerTxUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span className="font-mono">{truncateHash(txHash)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {contractAddress && (
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Contract Address</span>
                    <a
                      href={getExplorerContractUrl(contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span className="font-mono">{truncateHash(contractAddress)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300 text-left">
                  <strong>Privacy Protected:</strong> No wallet addresses, amounts, or personal data are visible on-chain. Only a cryptographic commitment hash is stored.
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
            
            <h2 className="text-xl font-bold text-white mb-2">Transaction Failed</h2>
            
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

