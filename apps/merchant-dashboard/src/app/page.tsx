'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Blurd Merchant Dashboard
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Verify Zero-Knowledge Proofs & Payment Status
        </p>
        <p className="text-gray-500 dark:text-gray-400 mb-12">
          Verify user attributes and payments without seeing any personal data
        </p>

        <Link
          href="/verify"
          className="inline-block px-8 py-4 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors text-lg font-semibold"
        >
          Verify Proof & Payment →
        </Link>
      </div>
    </main>
  );
}

