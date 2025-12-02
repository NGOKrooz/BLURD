'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface VerificationResult {
  verified: boolean;
  paymentConfirmed: boolean;
  credentialRegistered: boolean;
  proofHash?: string | null;
  txid?: string | null;
}

interface VerificationResultCardProps {
  result: VerificationResult | null;
}

/**
 * Compact result card focused on what merchants care about:
 *  - Verification result
 *  - Payment status
 *  - Credential registration
 */
export function VerificationResultCard({ result }: VerificationResultCardProps) {
  if (!result) return null;

  const overallOk = result.verified && (result.paymentConfirmed || !result.txid);

  return (
    <div
      className={clsx(
        'mt-6 rounded-xl border p-5 sm:p-6 backdrop-blur-md',
        overallOk
          ? 'bg-emerald-900/20 border-emerald-500/40'
          : 'bg-red-900/20 border-red-500/40'
      )}
    >
      <div className="flex items-start gap-3">
        {overallOk ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
        ) : (
          <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
            {overallOk ? 'Verification Successful' : 'Verification Failed'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-4">
            Verify eligibility and payment without accessing personal information.
          </p>

          <dl className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-400">Verification Result</dt>
              <dd className={result.verified ? 'text-emerald-300' : 'text-red-300'}>
                {result.verified ? 'YES' : 'NO'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-400">Payment Confirmed</dt>
              <dd className={result.paymentConfirmed ? 'text-emerald-300' : 'text-gray-300'}>
                {result.paymentConfirmed ? 'Confirmed' : 'Not Confirmed'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-gray-400">Credential Registered</dt>
              <dd
                className={
                  result.credentialRegistered ? 'text-emerald-300' : 'text-gray-300'
                }
              >
                {result.credentialRegistered ? 'Registered' : 'Not Registered'}
              </dd>
            </div>
            {result.proofHash && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Proof Hash</dt>
                <dd className="text-[11px] sm:text-xs text-gray-300 truncate font-mono">
                  {result.proofHash}
                </dd>
              </div>
            )}
            {result.txid && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-400">Transaction ID</dt>
                <dd className="text-[11px] sm:text-xs text-gray-300 truncate font-mono">
                  {result.txid}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}


