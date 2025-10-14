'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Briefcase, FolderKanban, Users, FileText, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Side Projects', href: '/side-projects', icon: FolderKanban },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                CM
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4 items-center">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'relative inline-flex items-center px-3 text-sm font-medium rounded-md transition-all duration-300 h-[60%] my-auto overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
                      </div>
                    )}
                    <Icon className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {session?.user?.name || session?.user?.email}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </nav>
  );
}
