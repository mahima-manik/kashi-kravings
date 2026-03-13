'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';

type LoginMode = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (loginMode === 'phone' && phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      setIsLoading(false);
      return;
    }

    try {
      const body = loginMode === 'phone'
        ? { phone, password }
        : { email, password };

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        if (data.role === 'store_owner' && data.storeCode) {
          router.push(`/stores/${data.storeCode}`);
        } else {
          const dest = data.role === 'sales_rep' ? '/sales-entry' : '/';
          router.push(dest);
        }
        router.refresh();
      } else {
        setError(loginMode === 'phone' ? 'Invalid phone number or password' : 'Invalid email or password');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-card rounded-2xl border border-surface-border p-8">
          {/* Brand Logo */}
          <div className="text-center mb-8">
            <img
              src="/logo.jpeg"
              alt="Kashi Kravings"
              className="w-28 h-28 mx-auto mb-4 rounded-2xl object-cover"
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sales Dashboard</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex rounded-lg border border-surface-border-light mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => { setLoginMode('email'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                loginMode === 'email'
                  ? 'bg-brand-olive text-white'
                  : 'bg-surface-primary text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('phone'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                loginMode === 'phone'
                  ? 'bg-brand-olive text-white'
                  : 'bg-surface-primary text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Phone
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMode === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition-colors"
                  placeholder="admin@kashikravings.com"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="w-full px-4 py-3 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition-colors"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-surface-primary border border-surface-border-light rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none transition-colors"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-olive hover:bg-brand-gold text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
