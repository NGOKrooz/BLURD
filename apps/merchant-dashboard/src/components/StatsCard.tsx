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
    <div className="bg-neutral-900/60 backdrop-blur-md rounded-xl border border-white/10 p-3 sm:p-4 lg:p-5 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        {icon && (
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">{label}</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl lg:text-2xl font-semibold text-white tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}


