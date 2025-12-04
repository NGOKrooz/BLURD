'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Key, Upload, CheckCircle2, User, FileText, Lock } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import WalletConnect from '@/components/WalletConnect';
import { loadStoredProofs, ProofResult } from '@/lib/zk/proof';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
  const [mounted, setMounted] = useState(false);
  const [proofs, setProofs] = useState<ProofResult[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    // Load stored proofs and credentials
    const storedProofs = loadStoredProofs();
    const storedCredentials = localStorage.getItem('blurd_credentials');
    setProofs(storedProofs);
    setCredentials(storedCredentials ? JSON.parse(storedCredentials) : []);
  }, []);

  if (!mounted) {
    return null;
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          zk-Passport Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          Your privacy-preserving cryptoidentity hub
        </p>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-sm text-gray-300">
                Connect your EVM wallet (MetaMask, Rainbow, Coinbase) to start using your zk-Passport.
                Your wallet address serves as your cryptoidentity handle.
              </p>
            </div>
            <div className="flex-shrink-0">
              <WalletConnect />
            </div>
          </div>
        </div>
      )}

      {/* Wallet Info */}
      {isConnected && address && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <User className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Cryptoidentity Handle</p>
                <p className="text-sm font-mono text-white">{truncateAddress(address)}</p>
                {balance && (
                  <p className="text-xs text-gray-400 mt-1">
                    {parseFloat(balance.formatted).toFixed(4)} ETH
                  </p>
                )}
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Upload Credential */}
          <Link
            href="/credentials/upload"
            className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Upload className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Upload Credential</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Upload ID documents (passport, student ID, driver license) and extract fields securely.
            </p>
            <div className="flex items-center text-blue-400 group-hover:text-blue-300">
              <span className="text-sm font-medium">Get Started</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>

          {/* Generate Proof */}
          <Link
            href="/generate-proof"
            className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <Key className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Generate Proof</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Create zero-knowledge proofs for age, nationality, or student status without revealing personal data.
            </p>
            <div className="flex items-center text-purple-400 group-hover:text-purple-300">
              <span className="text-sm font-medium">Generate</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>

          {/* Verify Proof */}
          <Link
            href="/verify"
            className="group bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-500/10"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Verify Proof</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Verify zero-knowledge proofs from others. Check validity without accessing sensitive information.
            </p>
            <div className="flex items-center text-green-400 group-hover:text-green-300">
              <span className="text-sm font-medium">Verify</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </div>
          </Link>
        </div>
      )}

      {/* Stats */}
      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Credentials */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Credentials</p>
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-white">{credentials.length}</p>
            <p className="text-xs text-gray-500 mt-1">Uploaded documents</p>
          </div>

          {/* Proofs Generated */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Proofs Generated</p>
              <Shield className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-white">{proofs.length}</p>
            <p className="text-xs text-gray-500 mt-1">ZK proofs created</p>
          </div>

          {/* Privacy Score */}
          <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Privacy Score</p>
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {proofs.length > 0 ? '100%' : '0%'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Zero-knowledge verified</p>
          </div>
        </div>
      )}

      {/* Recent Proofs */}
      {isConnected && proofs.length > 0 && (
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Proofs</h2>
            <Link
              href="/my-proofs"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {proofs.slice(0, 3).map((proof, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-white capitalize">
                      {proof.circuitType || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {proof.proofHash?.substring(0, 16)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span className="text-xs text-gray-400">Valid</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started Guide */}
      {isConnected && proofs.length === 0 && credentials.length === 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white mb-3">Getting Started</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-white">Upload a Credential</p>
                <p className="text-xs text-gray-400">
                  Upload your ID document (passport, student ID, etc.) to extract relevant fields.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-sm font-semibold">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-white">Generate a Proof</p>
                <p className="text-xs text-gray-400">
                  Create a zero-knowledge proof for age, nationality, or student status.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-white">Share Your Proof</p>
                <p className="text-xs text-gray-400">
                  Download and share your proof with platforms that need verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
