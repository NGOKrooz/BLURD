'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Overview of verification activity and status</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Verified Today</p>
              <p className="text-2xl font-semibold text-white">24</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Pending</p>
              <p className="text-2xl font-semibold text-white">3</p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Verified</p>
              <p className="text-2xl font-semibold text-white">1,247</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white mb-2">Ready to Verify?</h2>
          <p className="text-sm text-gray-400 mb-6">Upload proof files and verify zero-knowledge proofs</p>
          <Link
            href="/verify"
            className="inline-flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <span>Start Verification</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
