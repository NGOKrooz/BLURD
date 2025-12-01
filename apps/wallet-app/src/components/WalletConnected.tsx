'use client';

import { useState, useEffect } from 'react';
import { Wallet, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { detectAndConnectWallet, getStarknetBalance } from '@/lib/starknet';

/**
 * Wallet Connected Screen Component
 * Displays wallet address, STRK balance, and connection status
 * Integrates with Starknet wallet detection (Braavos/Argent X)
 */
export default function WalletConnected() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      // Check if wallet is already connected
      if (typeof window !== 'undefined' && (window.starknet || window.starknet_braavos || window.starknet_argentX)) {
        const wallet = await detectAndConnectWallet();
        if (wallet && wallet.selectedAddress) {
          setWalletAddress(wallet.selectedAddress);
          setIsConnected(true);
          
          // Fetch balance
          try {
            const bal = await getStarknetBalance(wallet.selectedAddress);
            // Convert from wei-like units to STRK (assuming 18 decimals)
            const balanceStr = (Number(bal) / 1e18).toFixed(4);
            setBalance(balanceStr);
          } catch (err) {
            console.error('Failed to fetch balance:', err);
            setBalance('0.0000');
          }
        }
      }
    } catch (err) {
      console.error('Wallet not connected:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const wallet = await detectAndConnectWallet();
      if (wallet && wallet.selectedAddress) {
        setWalletAddress(wallet.selectedAddress);
        setIsConnected(true);
        
        // Fetch balance
        const bal = await getStarknetBalance(wallet.selectedAddress);
        const balanceStr = (Number(bal) / 1e18).toFixed(4);
        setBalance(balanceStr);
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
      alert(err.message || 'Failed to connect wallet. Please install Braavos or Argent X.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setBalance(null);
    setIsConnected(false);
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <p className="text-sm text-gray-400">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !walletAddress) {
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
          <div className="flex h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-sm font-medium text-green-400">Wallet Connected</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>

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
            <p className="text-sm font-mono text-white break-all">{walletAddress}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">{truncateAddress(walletAddress)}</p>
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
            <p className="text-2xl font-bold text-white">{balance || '0.0000'}</p>
            <p className="text-xs text-gray-500 mt-1">Starknet Testnet</p>
          </div>
        </div>
      </div>

      {/* View on Explorer */}
      <a
        href={`https://sepolia.starkscan.co/contract/${walletAddress}`}
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

