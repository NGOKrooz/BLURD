'use client';

import { Lock, CheckCircle2, XCircle } from 'lucide-react';

interface PrivacyBannerProps {
  variant?: 'default' | 'success' | 'info';
  className?: string;
}

export default function PrivacyBanner({ variant = 'default', className = '' }: PrivacyBannerProps) {
  const variants = {
    default: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    success: 'bg-green-500/10 border-green-500/20 text-green-300',
    info: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
  };

  return (
    <div className={`rounded-lg border p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start space-x-3">
        <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Your Privacy is Protected</p>
          <p className="text-xs opacity-90">
            Your document is checked once, then permanently deleted. Only a cryptographic hash is stored - never your personal information.
          </p>
        </div>
      </div>
    </div>
  );
}

