'use client';

import { LogOut, Sun, Moon, Store, UserCircle, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const tabs = [
  { id: 'sales', label: 'Promotions', href: '/' },
  { id: 'invoices', label: 'Invoices', href: '/invoices' },
  { id: 'stores', label: 'Stores', href: '/stores', icon: Store },
];

export default function Header({ role, storeCode }: { role?: string | null; storeCode?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = () => setProfileOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [profileOpen]);

  const activeTab = pathname === '/invoices' ? 'invoices' : pathname?.startsWith('/stores') ? 'stores' : 'sales';
  const isStoreOwner = role === 'store_owner';

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const linkClass = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      active
        ? 'text-brand-olive dark:text-brand-gold'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`;

  const mobileLinkClass = (active: boolean) =>
    `block px-3 py-2 text-base font-medium rounded-md transition-colors ${
      active
        ? 'text-brand-olive dark:text-brand-gold bg-brand-olive/5 dark:bg-brand-gold/10'
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
    }`;

  const navLinks = isStoreOwner && storeCode
    ? [
        { href: '/store-home', label: 'Home', active: pathname === '/store-home' },
        { href: `/stores/${storeCode}`, label: 'My Invoices', active: pathname?.startsWith('/stores') ?? false },
      ]
    : !isStoreOwner
      ? tabs.map((tab) => ({ href: tab.href, label: tab.label, active: activeTab === tab.id }))
      : [];

  return (
    <header className="bg-surface-card border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Left: Hamburger on mobile, nav links on desktop */}
          <div className="flex items-center flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <nav className="hidden sm:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.active)}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <div className="flex-shrink-0">
            <Link href={isStoreOwner ? '/store-home' : '/'}>
              <Image
                src="/kashi-kravings-logo.jpeg"
                alt="Kashi Kravings"
                width={100}
                height={100}
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Profile menu"
              >
                <UserCircle className="h-5 w-5" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-surface-card border border-surface-border rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-surface-border bg-surface-card">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={mobileLinkClass(link.active)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
