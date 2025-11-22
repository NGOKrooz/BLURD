'use client';

import { useState, useEffect } from 'react';
import { Plus, Key, Trash2, Download, Eye } from 'lucide-react';
import Link from 'next/link';

interface Credential {
  id: string;
  idCommit: string;
  uniqueKeyHash: string;
  fields: {
    dob: string;
    docType: string;
    expiry: string;
    nonce: string;
  };
  issuedAt: string;
  userId?: string;
}

export default function CredentialList() {
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = () => {
    const stored = localStorage.getItem('blurd_credentials');
    if (stored) {
      setCredentials(JSON.parse(stored));
    }
  };

  const deleteCredential = (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    const updated = credentials.filter(c => c.id !== id);
    setCredentials(updated);
    localStorage.setItem('blurd_credentials', JSON.stringify(updated));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">My Credentials</h1>
          <p className="text-sm text-gray-400">
            Manage your privacy passes
          </p>
        </div>
        <Link
          href="/credentials/issue"
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Get New Privacy Pass</span>
        </Link>
      </div>

      {credentials.length === 0 ? (
        <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-12 text-center">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No Credentials Yet</h2>
          <p className="text-sm text-gray-400 mb-6">
            Get your first privacy pass to get started
          </p>
          <Link
            href="/credentials/issue"
            className="inline-flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Get Privacy Pass</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {credentials.map((credential) => (
            <div
              key={credential.id}
              className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                      <Key className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {credential.fields.docType?.replace('_', ' ').toUpperCase() || 'Credential'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Issued {formatDate(credential.issuedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-xs text-gray-400">
                      DOB: {credential.fields.dob}
                    </p>
                    <p className="text-xs text-gray-400">
                      Expiry: {credential.fields.expiry}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      Hash: {credential.uniqueKeyHash.slice(0, 16)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/credentials/generate-proof?id=${credential.id}`}
                    className="p-2 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                    title="Generate Proof"
                  >
                    <Download className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => {
                      // Show credential details
                      alert(`ID Commit: ${credential.idCommit.slice(0, 42)}...\nUnique Key Hash: ${credential.uniqueKeyHash}`);
                    }}
                    className="p-2 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCredential(credential.id)}
                    className="p-2 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

