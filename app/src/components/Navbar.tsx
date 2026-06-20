'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const Navbar: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SP</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              SquadPass
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Squads
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
            <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-500 !rounded-lg !h-10 !text-sm !font-medium" />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3">
          <Link
            href="/"
            className="block text-gray-400 hover:text-white transition-colors text-sm font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Squads
          </Link>
          <Link
            href="/dashboard"
            className="block text-gray-400 hover:text-white transition-colors text-sm font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
          <div className="pt-2">
            <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-500 !rounded-lg !h-10 !text-sm !font-medium !w-full" />
          </div>
        </div>
      )}
    </nav>
  );
};
