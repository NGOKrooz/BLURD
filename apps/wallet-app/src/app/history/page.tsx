'use client';

import { useState, useEffect } from 'react';
import { History as HistoryIcon, ExternalLink, CheckCircle2, Clock, Shield, Send } from 'lucide-react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { loadStoredProofs, ProofResult } from '@/lib/zk/proof';

interface Payment {
  txid: string;
  toAddress: string;
  amount: number;
  proofHash: string | null;
  timestamp: string;
  confirmed: boolean;
}

type ActivityType = 'payment' | 'proof';

interface Activity {
  type: ActivityType;
  timestamp: string;
  payment?: Payment;
  proof?: ProofResult;
}

export default function PaymentHistory() {
  const { address, isConnected } = useAccount();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const loadActivities = () => {
    const allActivities: Activity[] = [];

    // Load payments
    const storedPayments = localStorage.getItem('blurd_payments');
    if (storedPayments) {
      try {
        const payments = JSON.parse(storedPayments);
        const filtered = isConnected && address
          ? payments.filter((p: any) => p.fromAddress === address || !p.fromAddress)
          : payments;
        
        filtered.forEach((payment: Payment) => {
          allActivities.push({
            type: 'payment',
            timestamp: payment.timestamp,
            payment,
          });
        });
      } catch (e) {
        console.warn('Failed to load payments:', e);
      }
    }

    // Load proofs
    const proofs = loadStoredProofs();
    proofs.forEach((proof) => {
      allActivities.push({
        type: 'proof',
        timestamp: proof.generatedAt || new Date().toISOString(),
        proof,
      });
    });

    // Sort by timestamp (most recent first)
    allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(allActivities);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return addr.length > 20 ? addr.substring(0, 10) + '...' + addr.substring(addr.length - 10) : addr;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">History</h1>
        <p className="text-sm text-gray-400">
          View all your payment and proof generation activity
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-12 text-center">
          <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No Activity Yet</h2>
          <p className="text-sm text-gray-400 mb-6">
            Your payment and proof history will appear here
          </p>
          <div className="flex justify-center space-x-3">
            <Link
              href="/my-proofs"
              className="inline-flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>My Proofs</span>
            </Link>
            <Link
              href="/payments"
              className="inline-flex items-center space-x-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Payments</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={`${activity.type}-${index}`}
              className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6"
            >
              {activity.type === 'payment' && activity.payment ? (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        activity.payment.confirmed ? 'bg-green-500/20' : 'bg-yellow-500/20'
                      }`}>
                        {activity.payment.confirmed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                          <Send className="h-4 w-4" />
                          <span>Payment {activity.payment.confirmed ? 'Confirmed' : 'Pending'}</span>
                        </h3>
                        <p className="text-xs text-gray-400">
                          {formatDate(activity.payment.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400">To:</p>
                        <p className="text-xs text-white font-mono">{formatAddress(activity.payment.toAddress)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400">Amount:</p>
                        <p className="text-xs text-white font-semibold">{activity.payment.amount} MATIC</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400">TX ID:</p>
                        <p className="text-xs text-blue-400 font-mono">{formatAddress(activity.payment.txid)}</p>
                      </div>
                      {activity.payment.proofHash && (
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-400">Proof Hash:</p>
                          <p className="text-xs text-purple-400 font-mono">{formatAddress(activity.payment.proofHash)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://amoy.polygonscan.com/tx/${activity.payment.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                      title="View on PolygonScan"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : activity.type === 'proof' && activity.proof ? (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                        <Shield className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                          <span>Proof Generated</span>
                          <span className="text-xs text-gray-400 capitalize">({activity.proof.circuitType})</span>
                        </h3>
                        <p className="text-xs text-gray-400">
                          {formatDate(activity.proof.generatedAt || activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-neutral-800/40 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Proof Hash:</p>
                      <p className="text-xs text-blue-400 font-mono break-all">{activity.proof.proofHash}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const { downloadProof } = require('@/lib/zk/proof');
                        downloadProof(activity.proof!);
                      }}
                      className="p-2 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                      title="Download"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

