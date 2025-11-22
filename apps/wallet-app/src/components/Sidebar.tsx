'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Key, 
  Settings,
  FileText,
  List,
  Shield,
  Send,
  History
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  name?: string;
  href?: string;
  icon?: any;
  type?: 'divider';
}

interface SidebarProps {
  onClose?: () => void;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { type: 'divider' },
  { name: 'My Proofs', href: '/my-proofs', icon: Shield },
  { type: 'divider' },
  { name: 'Payments', href: '/payments', icon: Send },
  { type: 'divider' },
  { name: 'History', href: '/history', icon: History },
  { type: 'divider' },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-white/10 bg-neutral-900/40 backdrop-blur-md relative z-20 overflow-y-auto">
      <div className="flex h-16 items-center border-b border-white/10 px-4 sm:px-6 shrink-0">
        <h1 className="text-lg sm:text-xl font-semibold text-white">Blurd</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 sm:px-3 py-4 min-w-0">
        {navigation.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={`divider-${index}`} className="my-2 border-t border-white/10" />;
          }
          if (!item.href || !item.icon || !item.name) return null;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={clsx(
                'flex items-center space-x-3 rounded-lg px-3 py-2.5 sm:py-2 text-sm font-medium transition-colors min-h-[44px] touch-manipulation',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

