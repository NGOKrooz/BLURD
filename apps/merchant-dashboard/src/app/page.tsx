'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, History } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { calculateMetrics } from '@/lib/verification-history';

interface Metrics {
  verifiedToday: number;
  pending: number;
  totalVerified: number;
}

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics>({
    verifiedToday: 0,
    pending: 0,
    totalVerified: 0,
  });

  useEffect(() => {
    // Load metrics from verification history
    const loadMetrics = () => {
      try {
        const calculatedMetrics = calculateMetrics();
        setMetrics(calculatedMetrics);
      } catch (err) {
        console.error('Error calculating metrics:', err);
      }
    };

    loadMetrics();

    // Update metrics when storage changes (e.g., new verification)
    const handleStorageChange = () => {
      loadMetrics();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('verification-saved', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('verification-saved', handleStorageChange);
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pt-12 lg:pt-0">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">Merchant Dashboard</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-400">
          Minimal overview of verification activity. Start a new check in one click.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          label="Verified Today"
          value={metrics.verifiedToday}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatsCard
          label="Pending Verifications"
          value={metrics.pending}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatsCard
          label="Total Verified"
          value={metrics.totalVerified}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-neutral-950/80 via-neutral-900/80 to-neutral-950/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-lg p-4 sm:p-5 lg:p-7">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1">
                Start a Verification
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Verify identity proofs (Age and Country) without accessing personal information.
              </p>
            </div>
            <Link
              href="/verify"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors w-full sm:w-auto"
            >
              <span>Start Verification</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-950/80 via-neutral-900/80 to-neutral-950/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-lg p-4 sm:p-5 lg:p-7">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1">
                View History
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Browse past verifications and proof records.
              </p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 transition-colors w-full sm:w-auto"
            >
              <History className="mr-2 h-4 w-4" />
              <span>View History</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
