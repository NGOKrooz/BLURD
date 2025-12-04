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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-6xl pt-12 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center text-xs sm:text-sm text-gray-400 hover:text-white mb-3 sm:mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
            Verification History
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-400">
            View all past identity proof verifications.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            <span className="hidden sm:inline">Clear History</span>
            <span className="sm:hidden">Clear</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-neutral-950/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-lg p-8 sm:p-12 text-center">
          <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No Verifications Yet</h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-6">
            Start verifying identity proofs to see them appear here.
          </p>
          <Link
            href="/verify"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Start Verification
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {history.map((record) => (
            <div
              key={record.id}
              className={clsx(
                'bg-neutral-950/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border p-4 sm:p-5 lg:p-6',
                record.result.verified
                  ? 'border-emerald-500/40 bg-emerald-900/10'
                  : 'border-red-500/40 bg-red-900/10'
              )}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3">
                    {record.result.verified ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white capitalize">
                        {record.proofType === 'age18' ? 'Age Verification' : 
                         record.proofType === 'country' ? 'Country Verification' : 
                         'Identity Verification'}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 mt-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    {record.proofType === 'age18' && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-white/10">
                        <dt className="text-gray-400 font-medium">Age Verification</dt>
                        <dd className={clsx(
                          'font-semibold text-right sm:text-left',
                          record.result.ageVerified ? 'text-emerald-300' : 'text-red-300'
                        )}>
                          {record.result.ageVerified ? 'Age Verified ✅' : 'Age Not Verified ❌'}
                        </dd>
                      </div>
                    )}
                    {record.proofType === 'country' && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-white/10">
                        <dt className="text-gray-400 font-medium">Country Verification</dt>
                        <dd className={clsx(
                          'font-semibold text-right sm:text-left',
                          record.result.countryVerified ? 'text-emerald-300' : 'text-red-300'
                        )}>
                          {record.result.countryVerified ? 'Country Verified ✅' : 'Country Not Verified ❌'}
                        </dd>
                      </div>
                    )}
                    {record.proofHash && (
                      <div className="pt-2">
                        <dt className="text-gray-400 mb-1.5 flex items-center gap-2">
                          <Hash className="h-3 w-3 flex-shrink-0" />
                          <span>Proof Hash</span>
                        </dt>
                        <dd className="text-[10px] sm:text-[11px] lg:text-xs text-gray-300 break-all font-mono bg-neutral-900/40 rounded p-2">
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

