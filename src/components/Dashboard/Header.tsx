'use client';

import { LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
const tabs = [
  { id: 'sales', label: 'Sales' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'invoices', label: 'Invoices' },
];

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ onRefresh, isLoading, activeTab, onTabChange }: HeaderProps) {
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
              <p className="text-xs text-gray-400">
                {activeTab === 'sales' ? 'Sales Dashboard' : activeTab === 'promotions' ? 'Promotions Dashboard' : 'Invoice Management'}
              </p>
            </div>
            <nav className="flex items-center gap-1 ml-4 border-l border-surface-border pl-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'text-brand-gold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
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
