'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Blurd
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Private Payments with ZK Attribute Proofs
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-12">
          Make fully private payments while proving attributes without revealing personal data
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/generate-proof"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-2xl font-semibold mb-2">Generate Proof</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create a zero-knowledge proof for your attributes
            </p>
          </Link>

          <Link
            href="/send-payment"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-2xl font-semibold mb-2">Send Payment</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Send a shielded ZEC payment with proof binding
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

