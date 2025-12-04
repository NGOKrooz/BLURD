'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Key, CheckCircle2, Clock, Fingerprint, Lock, Wallet, ExternalLink, Zap } from 'lucide-react';
import { useEthereum } from '@/providers/ethereum-provider';
import { useEthBalance } from '@/hooks/useEthBalance';
import { loadStoredProofs } from '@/lib/zk/proof';
import WalletConnect from '@/components/WalletConnect';
import PrivacyTooltip from '@/components/PrivacyTooltip';

// Contract address for Etherscan link
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS || '';

interface CredentialStat {
  totalIssued: number;
  lastIssued: string | null;
  lastIssuedType: string | null;
  lastProofGenerated: string | null;
  proofs: number;
  payments: number;
}

export default function Dashboard() {
  const { address, isConnected, isCorrectNetwork, networkError } = useEthereum();
  const { balance, loading: balanceLoading, error: balanceError } = useEthBalance(address);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<CredentialStat>({
    totalIssued: 0,
    lastIssued: null,
    lastIssuedType: null,
    lastProofGenerated: null,
    proofs: 0,
    payments: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load credential stats from localStorage
    const storedCredentials = localStorage.getItem('blurd_credentials');
    const proofs = loadStoredProofs();
    const storedPayments = localStorage.getItem('blurd_payments');
    const payments = storedPayments ? JSON.parse(storedPayments) : [];
    
    if (storedCredentials) {
      try {
        const credentials = JSON.parse(storedCredentials);
        const totalIssued = credentials.length;
        const lastCredential = credentials.length > 0 ? credentials[credentials.length - 1] : null;
        
        const storedProofs = localStorage.getItem('blurd_proofs');
        let lastProofGenerated = null;
        if (storedProofs) {
          try {
            const parsedProofs = JSON.parse(storedProofs);
            if (parsedProofs.length > 0) {
              lastProofGenerated = parsedProofs[parsedProofs.length - 1].generatedAt;
            }
          } catch (e) {
            console.warn('Failed to parse stored proofs:', e);
          }
        }

        setStats({
          totalIssued,
          lastIssued: lastCredential?.issuedAt || null,
          lastIssuedType: lastCredential?.fields?.docType || null,
          lastProofGenerated,
          proofs: proofs.length,
          payments: payments.length,
        });
      } catch (e) {
        console.warn('Failed to parse stored credentials:', e);
        setStats({
          totalIssued: 0,
          lastIssued: null,
          lastIssuedType: null,
          lastProofGenerated: null,
          proofs: proofs.length,
          payments: payments.length,
        });
      }
    } else {
      setStats({
        totalIssued: 0,
        lastIssued: null,
        lastIssuedType: null,
        lastProofGenerated: null,
        proofs: proofs.length,
        payments: payments.length,
      });
    }
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid date';
    }
  };

  if (!mounted) {
    return (
      <div>
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg border border-white/10 p-6 sm:p-8 backdrop-blur-md">
            <div className="max-w-3xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-4 sm:mb-5 leading-tight">
                Prove Anything. <span className="text-blue-400">Reveal Nothing.</span>
              </h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg border border-white/10 p-4 sm:p-6 lg:p-8 backdrop-blur-md">
          <div className="max-w-3xl w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-3 sm:mb-4 md:mb-5 leading-tight">
              Prove Anything. <span className="text-blue-400">Reveal Nothing.</span>
            </h1>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Identity Proofs
              </span>
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Payment Proofs
              </span>
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                Reusable ZK Credentials
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
          <Link
            href="/my-proofs"
            className="inline-flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 sm:px-6 py-3 sm:py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors min-h-[44px] touch-manipulation"
          >
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span>My Proofs</span>
            <ArrowRight className="h-4 w-4 flex-shrink-0" />
          </Link>
          <Link
            href="/payments"
            className="inline-flex items-center justify-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 sm:px-6 py-3 sm:py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors min-h-[44px] touch-manipulation"
          >
            <Key className="h-4 w-4 flex-shrink-0" />
            <span>Payments</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">Overview</h2>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="mb-6 sm:mb-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-base sm:text-lg font-semibold text-yellow-300">Connect Your Ethereum Wallet</h3>
            <div className="flex-shrink-0">
              <WalletConnect />
            </div>
          </div>
        </div>
      )}

      {/* Network Error Banner */}
      {isConnected && !isCorrectNetwork && (
        <div className="mb-6 sm:mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-300">Wrong Network</h3>
              <p className="text-xs text-red-200 mt-1">
                {networkError || 'Please switch your wallet to Ethereum Sepolia or Aztec Sepolia network.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      {isConnected && address && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <Wallet className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-xs font-medium text-gray-400">Connected Wallet</p>
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              </div>
              <p className="text-sm font-mono text-white truncate">{address}</p>
              <div className="flex items-center mt-2">
                {balanceLoading ? (
                  <p className="text-sm text-gray-400">Fetching balance…</p>
                ) : balanceError ? (
                  <p className="text-sm text-red-400">{balanceError}</p>
                ) : (
                  <p className="text-lg font-bold text-white">
                    {balance || '0.0000'} <span className="text-sm text-gray-400">ETH</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Info Banner */}
      {CONTRACT_ADDRESS && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-md rounded-xl border border-purple-500/20 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-white">Privacy Payment Contract</p>
                  <PrivacyTooltip type="privacy" iconSize="sm" position="top" />
                </div>
                <p className="text-xs text-gray-400 font-mono truncate max-w-[200px] sm:max-w-none">
                  {CONTRACT_ADDRESS}
                </p>
              </div>
            </div>
            <a
              href={`https://sepolia.starkscan.co/contract/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-sm font-medium text-purple-300 hover:text-purple-200 transition-all"
            >
              <span>View on StarkScan</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-4 sm:grid-cols-3 mb-6 sm:mb-8">
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 p-5 sm:p-6 shadow-lg hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Verified Proofs</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.proofs}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 p-5 sm:p-6 shadow-lg hover:border-green-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                <Fingerprint className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Last Proof Issued</p>
              <p className="text-sm sm:text-base font-semibold text-white break-words">{formatDate(stats.lastIssued)}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 p-5 sm:p-6 shadow-lg hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Last Proof Type</p>
              <p className="text-sm sm:text-base font-semibold text-white capitalize break-words">
                {stats.lastIssuedType ? stats.lastIssuedType.replace('_', ' ') : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/my-proofs"
            className="group relative rounded-xl border border-white/10 bg-neutral-900/40 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-blue-500/30 hover:shadow-xl touch-manipulation"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">My Proofs</h3>
                <p className="text-xs sm:text-sm text-gray-400">Generate ZK identity proofs</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>
          
          <Link
            href="/payments"
            className="group relative rounded-xl border border-white/10 bg-neutral-900/40 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-green-500/30 hover:shadow-xl touch-manipulation"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Payments</h3>
                <p className="text-xs sm:text-sm text-gray-400">Send & verify private payments</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>

          <Link
            href="/history"
            className="group relative rounded-xl border border-white/10 bg-neutral-900/40 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-purple-500/30 hover:shadow-xl touch-manipulation sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">History</h3>
                <p className="text-xs sm:text-sm text-gray-400">View payment & proof history</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
