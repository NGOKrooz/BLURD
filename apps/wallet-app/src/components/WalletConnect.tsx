'use client';

import { useState, useEffect } from 'react';
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useStarknet } from '@/providers/starknet-provider';
import StatusModal, { ModalStatus } from './StatusModal';

/**
 * Starknet Wallet Connect Component
 * Replaces RainbowKit ConnectButton with Starknet-native wallet connection
 * Supports: Argent X, Braavos
 */
export default function WalletConnect() {
  const { isConnected, address, connect, disconnect, error, isCorrectNetwork, networkError } = useStarknet();
  const [walletDetected, setWalletDetected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStatus>(null);

  useEffect(() => {
    // Check if any Starknet wallet is installed
    if (typeof window !== 'undefined') {
      const detected = !!(window.starknet_braavos || window.starknet_argentX || window.starknet);
      setWalletDetected(detected);
    }
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setModalStatus('connecting');
      await connect();
      setModalStatus(null);
    } catch (err: any) {
      console.error('Connection failed:', err);
      setModalStatus(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleCloseModal = () => {
    setModalStatus(null);
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
  };

  if (!walletDetected) {
    return (
      <div className="relative z-50">
        <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <span className="text-xs text-yellow-300">No Starknet wallet detected</span>
        </div>
      </div>
    );
  }

  if (isConnected && address) {
    const statusColor = isCorrectNetwork ? 'green' : 'red';
    const statusBg = isCorrectNetwork ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
    const dotColor = isCorrectNetwork ? 'bg-green-400' : 'bg-red-400';
    const textColor = isCorrectNetwork ? 'text-green-300' : 'text-red-300';
    
    return (
      <div className="relative z-50">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-4 py-2 ${statusBg} border rounded-lg`}>
            <div className={`h-2 w-2 rounded-full ${dotColor} animate-pulse`}></div>
            <span className={`text-xs font-mono ${textColor}`}>{truncateAddress(address)}</span>
            {!isCorrectNetwork && (
              <span className="text-xs text-red-400 ml-1">(Wrong Network)</span>
            )}
          </div>
          <button
            onClick={disconnect}
            className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Disconnect
          </button>
        </div>
        {!isCorrectNetwork && networkError && (
          <div className="mt-2 text-xs text-red-400 max-w-xs">
            {networkError}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Connecting Modal */}
      <StatusModal
        status={modalStatus}
        onClose={handleCloseModal}
        errorMessage={error || undefined}
      />

      <div className="relative z-50">
        <button
          onClick={handleConnect}
          disabled={connecting}
          className={`flex items-center space-x-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-all duration-200 ${
            connecting 
              ? 'bg-blue-600/50 cursor-wait' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-blue-500/25'
          }`}
        >
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
        {error && !modalStatus && (
          <div className="mt-2 text-xs text-red-400 max-w-xs">
            {error}
          </div>
        )}
      </div>
    </>
  );
}
