'use client';

import { useRouter } from 'next/navigation';

export default function SalesEntryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      <header className="bg-surface-card border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Kashi Kravings"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="font-semibold text-gray-900 dark:text-white">Kashi Kravings</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Logout
        </button>
      </header>
      {children}
    </div>
  );
}
