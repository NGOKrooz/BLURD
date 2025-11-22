'use client';

import { useState } from 'react';
import { Copy, Check, Settings as SettingsIcon } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Settings() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const displayAddress = address ? (address.length > 20 ? address.substring(0, 10) + '...' + address.substring(address.length - 10) : address) : 'Not connected';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your privacy pass settings</p>
      </div>

      <div className="space-y-6">
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Privacy Settings</span>
          </h2>
          <div className="space-y-4">
            {!isConnected ? (
              <div>
                <p className="text-sm text-gray-300 mb-4">Connect your wallet to view your address</p>
                <ConnectButton />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Address
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm font-mono text-white">
                    {displayAddress}
                  </code>
                  {address && (
                    <button
                      onClick={() => copyToClipboard(address, 'address')}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 flex items-center space-x-1"
                    >
                      {copied === 'address' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copied === 'address' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  This address is used to bind your credentials to your wallet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Data Management</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-300 mb-2">
                Clear all locally stored credentials and proofs
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all stored credentials? This cannot be undone.')) {
                    localStorage.removeItem('blurd_credentials');
                    localStorage.removeItem('blurd_proofs');
                    alert('All stored credentials and proofs have been cleared.');
                  }
                }}
                className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">Privacy Information</h3>
          <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
            <li>All credentials are stored locally on your device</li>
            <li>No personal information is ever sent to servers</li>
            <li>Only cryptographic hashes are stored server-side</li>
            <li>You have full control over your data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
