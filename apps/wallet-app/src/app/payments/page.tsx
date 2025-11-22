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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Payments</h1>
        <p className="text-sm text-gray-400">Send and verify private payments with ZK identity proofs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Send Private Payment Card */}
        <Link
          href="/payments/send"
          className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Send className="h-6 w-6 text-blue-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Send Private Payment</h2>
          <p className="text-sm text-gray-400">
            Send a private payment and optionally bind it to a ZK identity proof (Age 18+, Nationality, or Human Uniqueness).
          </p>
        </Link>

        {/* Verify Incoming Payment Card */}
        <Link
          href="/payments/verify"
          className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Verify Incoming Payment</h2>
          <p className="text-sm text-gray-400">
            Upload a payment-proof.json file to verify that a payment was made and optionally check the required amount.
          </p>
        </Link>

        {/* Payment History Card */}
        <Link
          href="/history"
          className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <History className="h-6 w-6 text-purple-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Payment History</h2>
          <p className="text-sm text-gray-400">
            View all your past payments, proof generations, and verification history.
          </p>
        </Link>
      </div>

      {/* Privacy Summary */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Privacy-First Payments</h3>
            <p className="text-xs text-blue-300 mb-3">
              Blurd uses privacy-preserving verification. Payment-proof.json files contain NO sensitive data:
            </p>
            <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside mb-3">
              <li>No wallet addresses are exposed</li>
              <li>No transaction hashes are revealed</li>
              <li>No timestamps are included</li>
              <li>No raw amounts are shown (only validation signals)</li>
            </ul>
            <p className="text-xs text-blue-300">
              Only zero-knowledge validation signals are included, ensuring maximum privacy compliance with &quot;Private Payments & Transactions&quot; track requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
        <p className="text-xs text-gray-300">
          <strong>Note:</strong> In MVP mode, Blurd simulates shielded Zcash-like payments locally. Payments are stored in your browser and a privacy-preserving payment-proof.json file is generated for sharing with merchants.
        </p>
      </div>
    </div>
  );
}
