'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Key, Fingerprint, Lock, Wallet, Send, History, Settings, Upload, CheckCircle2 } from 'lucide-react';
import { loadStoredProofs } from '@/lib/zk/proof';
import WalletConnected from '@/components/WalletConnected';
import { useStarknet } from '@/providers/starknet-provider';

/**
 * Enhanced Dashboard - Starknet-native, Privacy-first
 * Features:
 * - Wallet connection status with STR balance
 * - Overview cards for proofs and payments
 * - Quick actions navigation
 * - Clean, hackathon-ready design
 */
export default function DashboardEnhanced() {
  const { isConnected } = useStarknet();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalProofs: 0,
    totalPayments: 0,
    lastProofType: null as string | null,
    lastProofTime: null as string | null,
  });

  useEffect(() => {
    setMounted(true);
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const proofs = loadStoredProofs();
      const storedPayments = localStorage.getItem('blurd_payment_proofs');
      const payments = storedPayments ? JSON.parse(storedPayments) : [];
      
      let lastProofType = null;
      let lastProofTime = null;
      if (proofs.length > 0) {
        const lastProof = proofs[proofs.length - 1];
        lastProofType = lastProof.circuitType || null;
        lastProofTime = lastProof.generatedAt || null;
      }

      setStats({
        totalProofs: proofs.length,
        totalPayments: payments.length,
        lastProofType,
        lastProofTime,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

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
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg border border-white/10 p-6 sm:p-8 backdrop-blur-md">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-4 sm:mb-5 leading-tight">
              Prove Anything. <span className="text-blue-400">Reveal Nothing.</span>
            </h1>
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
                Starknet Testnet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="mb-6 sm:mb-8">
        <WalletConnected />
      </div>

      {/* Overview Cards */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-5">Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-4 sm:grid-cols-3">
          {/* Total Verified Proofs */}
          <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-5 sm:p-6 shadow-lg hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Verified Proofs</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalProofs}</p>
              </div>
            </div>
          </div>

          {/* Last Proof */}
          <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-5 sm:p-6 shadow-lg hover:border-green-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                  <Fingerprint className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Last Proof</p>
                <p className="text-sm sm:text-base font-semibold text-white break-words">
                  {stats.lastProofType ? stats.lastProofType.replace('_', ' ').toUpperCase() : 'None'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(stats.lastProofTime)}</p>
              </div>
            </div>
          </div>

          {/* Total Payments */}
          <div className="bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 p-5 sm:p-6 shadow-lg hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                  <Lock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Payments</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalPayments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* My Proofs */}
          <Link
            href="/my-proofs"
            className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-blue-500/30 hover:shadow-xl touch-manipulation"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                    <Shield className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">My Proofs</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">Generate ZK identity proofs</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>

          {/* Send Payment */}
          <Link
            href="/payments/send-enhanced"
            className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-green-500/30 hover:shadow-xl touch-manipulation"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                    <Send className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Send Payment</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">Send private payments on Starknet</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>

          {/* Verify Payment */}
          <Link
            href="/payments/verify"
            className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-purple-500/30 hover:shadow-xl touch-manipulation"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                    <CheckCircle2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Verify Payment</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">Verify incoming payments</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>

          {/* History */}
          <Link
            href="/history"
            className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-yellow-500/30 hover:shadow-xl touch-manipulation sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                    <History className="h-5 w-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">History</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">View payment & proof history</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 backdrop-blur-md p-5 sm:p-6 shadow-lg transition-all hover:bg-neutral-900/60 hover:border-gray-500/30 hover:shadow-xl touch-manipulation sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/20">
                    <Settings className="h-5 w-5 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Settings</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">Manage your preferences</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-300 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

