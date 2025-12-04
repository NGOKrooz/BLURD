'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

export type ProofType = 'age18' | 'country' | 'unknown';

export interface VerificationResult {
  verified: boolean;
  proofType: ProofType;
  proofHash?: string | null;
  ageVerified?: boolean;
  countryVerified?: boolean;
}

interface VerificationResultCardProps {
  result: VerificationResult | null;
}

/**
 * Clean result card focused on identity proof verification:
 *  - Age verification status
 *  - Country verification status
 *  - Proof hash
 */
export function VerificationResultCard({ result }: VerificationResultCardProps) {
  if (!result) return null;

  const isAgeProof = result.proofType === 'age18';
  const isCountryProof = result.proofType === 'country';
  const overallOk = result.verified;

  return (
    <div
      className={clsx(
        'mt-4 sm:mt-6 rounded-xl border p-4 sm:p-5 lg:p-6 backdrop-blur-md',
        overallOk
          ? 'bg-emerald-900/20 border-emerald-500/40'
          : 'bg-red-900/20 border-red-500/40'
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {overallOk ? (
          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-2">
            {overallOk ? 'Verification Successful' : 'Verification Failed'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
            Identity proof verified without accessing personal information.
          </p>

          <dl className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            {isAgeProof && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-white/10">
                <dt className="text-gray-400 font-medium">Age Verification</dt>
                <dd className={clsx(
                  'font-semibold text-right sm:text-left',
                  result.ageVerified ? 'text-emerald-300' : 'text-red-300'
                )}>
                  {result.ageVerified ? 'Age Verified ✅' : 'Age Not Verified ❌'}
                </dd>
              </div>
            )}
            {isCountryProof && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-2 border-b border-white/10">
                <dt className="text-gray-400 font-medium">Country Verification</dt>
                <dd className={clsx(
                  'font-semibold text-right sm:text-left',
                  result.countryVerified ? 'text-emerald-300' : 'text-red-300'
                )}>
                  {result.countryVerified ? 'Country Verified ✅' : 'Country Not Verified ❌'}
                </dd>
              </div>
            )}
            {result.proofHash && (
              <div className="pt-2">
                <dt className="text-gray-400 mb-1.5">Proof Hash</dt>
                <dd className="text-[10px] sm:text-[11px] lg:text-xs text-gray-300 break-all font-mono bg-neutral-900/40 rounded p-2">
                  {result.proofHash}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}


