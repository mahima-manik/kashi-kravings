'use client';

import { LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Header({ onRefresh, isLoading }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-surface-card border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Kashi Kravings"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Kashi Kravings</h1>
              <p className="text-xs text-gray-400">Sales Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 bg-surface-card-hover border border-surface-border-light text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-surface-border transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 bg-chocolate-700 hover:bg-chocolate-600 text-sm font-medium rounded-lg text-white transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
