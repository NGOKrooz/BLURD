'use client';

import { useState } from 'react';
import { Send, Shield, History, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Payments Dashboard
 * Main landing page for payment features
 */
export default function PaymentsDashboard() {
  return (
    <div className="w-full max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">Payments</h1>
        <p className="text-xs sm:text-sm text-gray-400">Send and verify private payments with ZK identity proofs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Send Private Payment Card */}
        <Link
          href="/payments/send"
          className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-5 sm:p-6 hover:border-blue-500/30 hover:shadow-xl transition-all group touch-manipulation"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors flex-shrink-0">
              <Send className="h-6 w-6 text-blue-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Send Private Payment</h2>
          <p className="text-sm text-gray-400 break-words">
            Send private payments with optional ZK identity proof binding
          </p>
        </Link>

        {/* Verify Incoming Payment Card */}
        <Link
          href="/payments/verify"
          className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-5 sm:p-6 hover:border-green-500/30 hover:shadow-xl transition-all group touch-manipulation"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 group-hover:bg-green-500/30 transition-colors flex-shrink-0">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Verify Incoming Payment</h2>
          <p className="text-sm text-gray-400 break-words">
            Verify payments via payment-proof.json upload
          </p>
        </Link>

        {/* Payment History Card */}
        <Link
          href="/history"
          className="bg-neutral-900/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg p-5 sm:p-6 hover:border-purple-500/30 hover:shadow-xl transition-all group touch-manipulation sm:col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors flex-shrink-0">
              <History className="h-6 w-6 text-purple-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Payment History</h2>
          <p className="text-sm text-gray-400 break-words">
            View payment and proof history
          </p>
        </Link>
      </div>

      {/* Privacy Summary */}
      <div className="mt-6 sm:mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 sm:p-6 overflow-x-hidden">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-blue-300 mb-2">Privacy-First</h3>
            <p className="text-xs text-blue-300 break-words">
              Payment-proof.json files contain zero-knowledge validation signals only. No wallet addresses, transaction hashes, or timestamps are exposed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
