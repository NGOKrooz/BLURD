'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

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
    // Fetch real-time metrics from BLURD API
    // Expected response shape (example):
    // { verifiedToday: number; pending: number; totalVerified: number }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.warn('NEXT_PUBLIC_API_URL is not set; dashboard metrics will remain at 0.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/merchant/metrics`);
        if (!res.ok) {
          console.warn('Failed to fetch merchant metrics:', res.status);
          return;
        }
        const data = await res.json();
        setMetrics({
          verifiedToday: Number(data.verifiedToday ?? 0),
          pending: Number(data.pending ?? 0),
          totalVerified: Number(data.totalVerified ?? 0),
        });
      } catch (err) {
        console.error('Error fetching merchant metrics:', err);
        // Leave metrics at 0 on error; no dummy data
      }
    })();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Merchant Dashboard</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-400">
          Minimal overview of verification activity. Start a new check in one click.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
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

      <div className="bg-gradient-to-br from-neutral-950/80 via-neutral-900/80 to-neutral-950/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">
              Start a Verification
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Verify identity proofs (Age and Country) without accessing personal information.
            </p>
          </div>
          <Link
            href="/verify"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <span>Start Verification</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
