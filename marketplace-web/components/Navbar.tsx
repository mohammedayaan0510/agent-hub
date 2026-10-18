'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { 
  Key, Activity, DollarSign, Store, Sparkles, 
  CreditCard, Home, Sun, Moon 
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    { href: '/dashboard/keys', label: 'API Keys', icon: Key },
    { href: '/dashboard/billing', label: 'Billing & Credits', icon: CreditCard },
    { href: '/dashboard/usage', label: 'Usage & Logs', icon: Activity },
    { href: '/dashboard/payouts', label: 'Revenue & Payouts', icon: DollarSign },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-zinc-100 hover:opacity-90 transition">
          <div className="p-1.5 bg-indigo-600 rounded-xl text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>AgentHub</span>
        </Link>

        {/* Navigation Links + Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Dark / Light Mode Switcher Button */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}