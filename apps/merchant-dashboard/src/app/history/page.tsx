'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Calendar, Hash, Trash2 } from 'lucide-react';
import { getVerificationHistory, clearVerificationHistory, type VerificationRecord } from '@/lib/verification-history';
import { clsx } from 'clsx';

export default function History() {
  const [history, setHistory] = useState<VerificationRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadHistory();
  }, []);

  const loadHistory = () => {
    const records = getVerificationHistory();
    setHistory(records);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all verification history? This action cannot be undone.')) {
      clearVerificationHistory();
      loadHistory();
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Verification History
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400">
            View all past identity proof verifications.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-neutral-950/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Verifications Yet</h3>
          <p className="text-sm text-gray-400 mb-6">
            Start verifying identity proofs to see them appear here.
          </p>
          <Link
            href="/verify"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Start Verification
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div
              key={record.id}
              className={clsx(
                'bg-neutral-950/70 backdrop-blur-xl rounded-2xl border p-5 sm:p-6',
                record.result.verified
                  ? 'border-emerald-500/40 bg-emerald-900/10'
                  : 'border-red-500/40 bg-red-900/10'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {record.result.verified ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white capitalize">
                        {record.proofType === 'age18' ? 'Age Verification' : 
                         record.proofType === 'country' ? 'Country Verification' : 
                         'Identity Verification'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    {record.proofType === 'age18' && (
                      <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10">
                        <dt className="text-gray-400 font-medium">Age Verification</dt>
                        <dd className={record.result.ageVerified ? 'text-emerald-300 font-semibold' : 'text-red-300 font-semibold'}>
                          {record.result.ageVerified ? 'Age Verified ✅' : 'Age Not Verified ❌'}
                        </dd>
                      </div>
                    )}
                    {record.proofType === 'country' && (
                      <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10">
                        <dt className="text-gray-400 font-medium">Country Verification</dt>
                        <dd className={record.result.countryVerified ? 'text-emerald-300 font-semibold' : 'text-red-300 font-semibold'}>
                          {record.result.countryVerified ? 'Country Verified ✅' : 'Country Not Verified ❌'}
                        </dd>
                      </div>
                    )}
                    {record.proofHash && (
                      <div className="pt-2">
                        <dt className="text-gray-400 mb-1.5 flex items-center gap-2">
                          <Hash className="h-3 w-3" />
                          Proof Hash
                        </dt>
                        <dd className="text-[11px] sm:text-xs text-gray-300 break-all font-mono bg-neutral-900/40 rounded p-2">
                          {record.proofHash}
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

