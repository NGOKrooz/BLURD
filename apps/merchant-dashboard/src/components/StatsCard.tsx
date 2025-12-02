'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

/**
 * Minimal, reusable stats card for merchant metrics
 * Example usage:
 *   <StatsCard label="Verified Today" value={metrics.verifiedToday} icon={<CheckCircle2 />} />
 */
export default function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <div className="bg-neutral-900/60 backdrop-blur-md rounded-xl border border-white/10 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-400">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-semibold text-white tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}


