'use client';

import { useState } from 'react';
import { Wallet, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useStarknet } from '@/providers/starknet-provider';
import { useStrkBalance } from '@/hooks/useStrkBalance';

/**
 * Wallet Connected Screen Component
 * Displays wallet address, STRK balance, and connection status
 * Integrates with Starknet wallet detection (Braavos/Argent X)
 */
export default function WalletConnected() {
  const { address, isConnected, connect, disconnect, isCorrectNetwork, networkError } = useStarknet();
  const { balance, loading: balanceLoading, error: balanceError } = useStrkBalance(address);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connect();
      // Balance will be fetched automatically via useStrkBalance hook
    } catch (err: any) {
      console.error('Connection failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

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

  if (connecting && !isConnected) {
    return (
      <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <p className="text-sm text-gray-400">Connecting wallet...</p>
        </div>
      </div>
    );
  }

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
              Connect your Starknet wallet (Braavos or Argent X) to get started
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Wallet className="h-5 w-5" />
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 shadow-xl">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className={`flex h-3 w-3 rounded-full ${isCorrectNetwork ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
          <span className={`text-sm font-medium ${isCorrectNetwork ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrectNetwork ? 'Connected to Sepolia' : 'Wrong Network'}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Network Error Banner */}
      {!isCorrectNetwork && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300">
            {networkError || 'Please switch your wallet to Starknet Sepolia network.'}
          </p>
        </div>
      )}

      {/* Wallet Address */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 mb-2">Wallet Address</label>
        <div className="flex items-center space-x-3 bg-neutral-800/50 rounded-lg p-4 border border-white/5">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-white break-all">{address}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">{truncateAddress(address)}</p>
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

      {/* STRK Balance */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-400 mb-2">Balance</label>
        <div className="flex items-center space-x-3 bg-neutral-800/50 rounded-lg p-4 border border-white/5">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <span className="text-lg font-bold text-green-400">STRK</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-white">
              {balanceLoading ? (
                <span className="text-gray-400">Fetching balance…</span>
              ) : balanceError ? (
                <span className="text-red-400 text-sm">Unable to fetch balance</span>
              ) : (
                balance || '0.0000'
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {balanceError ? 'Check RPC connection' : 'Starknet Sepolia'}
            </p>
          </div>
        </div>
      </div>

      {/* View on Explorer */}
      <a
        href={`https://sepolia.starkscan.co/contract/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center space-x-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <span>View on Starkscan</span>
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

