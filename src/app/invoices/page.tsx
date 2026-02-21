'use client';

import { Header, InvoicesView } from '@/components/Dashboard';

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <InvoicesView />
      </main>
    </div>
  );
}
