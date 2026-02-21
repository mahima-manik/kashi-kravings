'use client';

import { LogOut, RefreshCw, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const tabs = [
  { id: 'sales', label: 'Sales' },
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
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
            />
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Kashi Kravings</h1>
            <nav className="hidden sm:flex items-center gap-1 ml-4 border-l border-surface-border pl-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'text-brand-gold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="inline-flex items-center p-2 bg-surface-card-hover border border-surface-border-light text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center p-2 sm:px-3 sm:py-2 bg-surface-card-hover border border-surface-border-light text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center p-2 sm:px-3 sm:py-2 bg-chocolate-700 hover:bg-chocolate-600 text-sm font-medium rounded-lg text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <nav className="sm:hidden flex items-center gap-1 pb-3 -mt-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-gold bg-brand-gold/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
