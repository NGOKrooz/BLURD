'use client';

import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Transaction Loading Animation Component
 * Shows animated spinner and status while waiting for transaction confirmation
 */
interface TransactionLoadingProps {
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed';
  txHash?: string;
  message?: string;
}

export default function TransactionLoading({ status, txHash, message }: TransactionLoadingProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />,
          text: message || 'Waiting for confirmation on the network...',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
        };
      case 'accepted':
        return {
          icon: <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />,
          text: 'Transaction accepted. Waiting for final confirmation...',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
        };
      case 'confirmed':
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-green-400" />,
          text: 'Transaction confirmed',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-8 w-8 text-red-400" />,
          text: 'Transaction rejected or failed',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
        };
      default:
        return {
          icon: <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />,
          text: 'Processing...',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 sm:p-8 backdrop-blur-md`}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex-shrink-0">{config.icon}</div>
        
        <div className="space-y-2">
          <p className={`text-base sm:text-lg font-semibold ${config.color}`}>
            {config.text}
          </p>
          
          {txHash && (
            <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg border border-white/5">
              <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
              <p className="text-xs font-mono text-white break-all">{txHash}</p>
            </div>
          )}

          {/* Progress Bar Animation (for pending/accepted) */}
          {(status === 'pending' || status === 'accepted') && (
            <div className="mt-4 w-full max-w-xs">
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

