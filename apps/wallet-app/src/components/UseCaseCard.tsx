'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface UseCaseCardProps {
  title: string;
  description: string;
  useFor: string;
  icon: LucideIcon;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

const colorClasses = {
  blue: 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30',
  green: 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30',
  purple: 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30',
  orange: 'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30',
  pink: 'bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30',
};

const iconColors = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
  pink: 'text-pink-400',
};

export default function UseCaseCard({
  title,
  description,
  useFor,
  icon: Icon,
  href,
  color,
}: UseCaseCardProps) {
  return (
    <Link
      href={href}
      className={`group relative rounded-lg border backdrop-blur-md p-6 shadow-sm transition-all ${colorClasses[color]}`}
    >
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 ${iconColors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-300 mb-2">{description}</p>
          <p className="text-xs text-gray-400">
            <span className="font-medium">Use for:</span> {useFor}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white flex-shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

