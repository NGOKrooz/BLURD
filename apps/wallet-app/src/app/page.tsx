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
    <div>
      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg border border-white/10 p-6 sm:p-8 backdrop-blur-md">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-4 sm:mb-5 leading-tight">
              Prove Anything. <span className="text-blue-400">Reveal Nothing.</span>
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Identity Proofs
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Payment Proofs
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                Reusable ZK Credentials
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/my-proofs"
            className="inline-flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span>My Proofs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/payments"
            className="inline-flex items-center justify-center space-x-2 rounded-lg border border-white/20 bg-white/5 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <Key className="h-4 w-4" />
            <span>Payments</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="mt-1 text-sm text-gray-400">Zero-knowledge identity and payment verification</p>
      </div>

      {/* Wallet Connection */}
      {!isConnected && (
        <div className="mb-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-300 mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-yellow-200">Connect your wallet to start using Blurd</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      {isConnected && address && (
        <div className="mb-8 bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <Wallet className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-400">Wallet Address</p>
              <p className="text-sm font-mono text-white">{address}</p>
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Verified Proofs</p>
              <p className="text-2xl font-semibold text-white">{stats.proofs}</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <Fingerprint className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Last Proof Issued</p>
              <p className="text-sm font-semibold text-white">{formatDate(stats.lastIssued)}</p>
              {stats.lastIssuedType && (
                <p className="text-xs text-gray-400 capitalize">{stats.lastIssuedType.replace('_', ' ')} {stats.lastProofGenerated ? '(age + nationality proof)' : ''}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <Lock className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Last Proof Type</p>
              <p className="text-sm font-semibold text-white capitalize">
                {stats.lastIssuedType ? stats.lastIssuedType.replace('_', ' ') : 'None'}
                {stats.lastIssuedType && ' (age + nationality proof)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/my-proofs"
            className="group relative rounded-lg border border-white/10 bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm transition-all hover:bg-neutral-900/60 hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">My Proofs</h3>
                <div className="mt-1 text-sm text-gray-400 space-y-1">
                  <p>• Upload encrypted credential</p>
                  <p>• Generate ZK identity proofs</p>
                  <p>• Manage reusable proofs</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white" />
            </div>
          </Link>
          
          <Link
            href="/payments"
            className="group relative rounded-lg border border-white/10 bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm transition-all hover:bg-neutral-900/60 hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Payments</h3>
                <div className="mt-1 text-sm text-gray-400 space-y-1">
                  <p>• Send private payments</p>
                  <p>• Bind payments to identity proofs (optional)</p>
                  <p>• Verify payment occurred without revealing details</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white" />
            </div>
          </Link>

          <Link
            href="/history"
            className="group relative rounded-lg border border-white/10 bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm transition-all hover:bg-neutral-900/60 hover:border-white/20"
          >
                <div className="flex items-center justify-between">
                    <div>
                <h3 className="text-base font-semibold text-white">History</h3>
                <div className="mt-1 text-sm text-gray-400 space-y-1">
                  <p>• View proof generation & payment events</p>
                  <p>• Export verification logs (privacy-preserving)</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white" />
          </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
