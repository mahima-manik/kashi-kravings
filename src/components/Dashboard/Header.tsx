'use client';

import { LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  lastUpdated: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Header({ lastUpdated, onRefresh, isLoading }: HeaderProps) {
  const router = useRouter();

  const formatLastUpdated = (isoString: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-chocolate-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">KK</span>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">Kashi Kravings</h1>
              <p className="text-sm text-gray-500">Sales Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 hidden sm:block">
              Updated: {formatLastUpdated(lastUpdated)}
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-chocolate-600 hover:bg-chocolate-700"
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
