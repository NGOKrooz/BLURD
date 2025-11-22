'use client';

import { Upload, CheckCircle2, Trash2, Key, Eye, EyeOff } from 'lucide-react';

export default function PrivacyFlow() {
  return (
    <div className="bg-neutral-900/40 backdrop-blur-md rounded-lg border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">How Blurd Protects Your Privacy</h3>
      
      {/* Flow Steps */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
            <Upload className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">1. Upload Your ID</p>
            <p className="text-xs text-gray-400">Document stays on your device</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">2. Blurd Checks What&apos;s Needed</p>
            <p className="text-xs text-gray-400">Age, country, or other requirements verified locally</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">3. Document Deleted Forever</p>
            <p className="text-xs text-gray-400">Your ID is permanently removed from memory</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
            <Key className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">4. Get Your Reusable Pass</p>
            <p className="text-xs text-gray-400">Use it anywhere without showing your ID again</p>
          </div>
        </div>
      </div>

      {/* What Merchants See */}
      <div className="border-t border-white/10 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="h-4 w-4 text-green-400" />
              <p className="text-xs font-medium text-green-300">Merchants See</p>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>✅ Verification result (YES/NO)</li>
              <li>✅ Payment confirmed</li>
            </ul>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <EyeOff className="h-4 w-4 text-red-400" />
              <p className="text-xs font-medium text-red-300">Merchants Don&apos;t See</p>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>❌ Your name</li>
              <li>❌ Your age</li>
              <li>❌ Your ID</li>
              <li>❌ Your device ID</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

