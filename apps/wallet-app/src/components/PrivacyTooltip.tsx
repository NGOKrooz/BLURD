'use client';

import { useState } from 'react';
import { HelpCircle, Shield, Lock, Eye, EyeOff, Info } from 'lucide-react';

type TooltipType = 'privacy' | 'zkproof' | 'identity' | 'hidden' | 'custom';

interface PrivacyTooltipProps {
  type?: TooltipType;
  customText?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tooltipContent: Record<TooltipType, { icon: React.ReactNode; title: string; text: string }> = {
  privacy: {
    icon: <Shield className="h-4 w-4 text-blue-400" />,
    title: 'Privacy Protected',
    text: 'Your personal information is never exposed. Only zero-knowledge proofs are generated and shared.',
  },
  zkproof: {
    icon: <Lock className="h-4 w-4 text-purple-400" />,
    title: 'Zero-Knowledge Proof',
    text: 'ZK proofs allow you to prove something (like being over 18) without revealing the actual data. The verifier learns nothing except that the statement is true.',
  },
  identity: {
    icon: <Shield className="h-4 w-4 text-green-400" />,
    title: 'Identity Anchor',
    text: 'Your wallet address serves as your cryptoidentity handle. Identity proofs are bound to your wallet for verification.',
  },
  hidden: {
    icon: <EyeOff className="h-4 w-4 text-yellow-400" />,
    title: 'Hidden Data',
    text: 'This information is stored locally on your device only. It is never transmitted to any server or stored on the blockchain.',
  },
  custom: {
    icon: <Info className="h-4 w-4 text-gray-400" />,
    title: 'Info',
    text: '',
  },
};

/**
 * Privacy Tooltip Component
 * Shows explanations for privacy-related concepts
 */
export default function PrivacyTooltip({
  type = 'privacy',
  customText,
  iconSize = 'sm',
  position = 'top',
}: PrivacyTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const content = tooltipContent[type];
  const displayText = customText || content.text;

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-neutral-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-neutral-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-neutral-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-neutral-800 border-y-transparent border-l-transparent',
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="p-1 text-gray-400 hover:text-gray-300 transition-colors rounded-full hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-label="More information"
      >
        <HelpCircle className={iconSizes[iconSize]} />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="bg-neutral-800 border border-white/10 rounded-lg shadow-xl p-3 w-64">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5">{content.icon}</div>
              <div>
                <p className="text-xs font-semibold text-white mb-1">{content.title}</p>
                <p className="text-xs text-gray-300 leading-relaxed">{displayText}</p>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div
            className={`absolute border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Inline Privacy Badge
 * A compact badge with tooltip
 */
export function PrivacyBadge({
  label,
  type = 'privacy',
  variant = 'blue',
}: {
  label: string;
  type?: TooltipType;
  variant?: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const variantClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    green: 'bg-green-500/10 border-green-500/20 text-green-300',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium ${variantClasses[variant]}`}>
      <Shield className="h-3 w-3 mr-1" />
      {label}
      <PrivacyTooltip type={type} iconSize="sm" position="top" />
    </span>
  );
}
