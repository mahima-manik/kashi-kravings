import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/auth';
import { Header } from '@/components/Dashboard';
import Chat from '@/components/Dashboard/Chat';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: string | null = null;
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('kk-auth');
    if (authCookie?.value) {
      const session = await verifySessionCookie(authCookie.value);
      if (session) role = session.role;
    }
  } catch {
    // Cookie parsing failed — treat as unauthenticated
  }

  const isStoreOwner = role === 'store_owner';

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header role={role} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      {!isStoreOwner && <Chat />}
    </div>
  );
}
