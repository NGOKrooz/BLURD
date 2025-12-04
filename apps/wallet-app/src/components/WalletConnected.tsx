'use client';

import { useState } from 'react';
import { Wallet, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import WalletConnect from '@/components/WalletConnect';

/**
 * Wallet Connected Screen Component
 * Displays wallet address and connection status
 * Integrates with EVM wallets via RainbowKit (MetaMask, Rainbow, Coinbase, WalletConnect, OKX)
 */
export default function WalletConnected() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
  };

  if (!isConnected || !address) {
    return (
      <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
              <Wallet className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-400 mb-6">
              Connect your EVM wallet (MetaMask, Rainbow, Coinbase) to get started
            </p>
          </div>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 shadow-xl">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-sm font-medium text-green-400">
            Connected
          </span>
        </div>
      </div>

      {/* Cryptoidentity Handle */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 mb-2">Cryptoidentity Handle</label>
        <div className="flex items-center space-x-3 bg-neutral-800/50 rounded-lg p-4 border border-white/5">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-white break-all">{address}</p>
            <p className="text-xs text-gray-500 mt-1">This wallet address is your identity anchor</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors"
            title="Copy address"
          >
            {copied ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* View on Explorer */}
      <a
        href={`https://sepolia.etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center space-x-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <span>View on Etherscan</span>
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

