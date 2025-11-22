'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Key, CheckCircle2, Clock, Fingerprint, Lock, Wallet } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { loadStoredProofs } from '@/lib/zk/proof';

interface CredentialStat {
  totalIssued: number;
  lastIssued: string | null;
  lastIssuedType: string | null;
  lastProofGenerated: string | null;
  proofs: number;
  payments: number;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });
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
            <h3 className="text-base sm:text-lg font-semibold text-yellow-300">Connect Your Wallet</h3>
            <div className="flex-shrink-0">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      {isConnected && address && (
        <div className="mb-6 sm:mb-8 bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <Wallet className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Wallet Address</p>
              <p className="text-xs sm:text-sm font-mono text-white break-all">{address}</p>
              {balance && (
                <p className="text-xs text-gray-400 mt-1">
                  Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      {isConnected && address && (
        <div className="mb-6 sm:mb-8 bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <Wallet className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Wallet Address</p>
              <p className="text-xs sm:text-sm font-mono text-white break-all">{address}</p>
              {balance && (
                <p className="text-xs text-gray-400 mt-1">
                  Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </p>
              )}
            </div>
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
