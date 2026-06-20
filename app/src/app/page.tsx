'use client';

import { useSquads } from '@/hooks/useSquads';
import { SquadCard } from '@/components/SquadCard';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function HomePage() {
  const { squads, loading, error } = useSquads();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">
                Live on Solana Devnet
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Pay once.{' '}
              <span className="text-emerald-400">Belong all tournament.</span>
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              SquadPass turns World Cup fandom into a recurring, programmable
              fan-club experience. Join a squad, predict matches, climb the
              leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-500 !rounded-xl !h-12 !text-base !font-semibold !px-8" />
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors underline underline-offset-4"
              >
                Create a squad
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-center text-2xl font-bold text-white mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Join a Squad',
              desc: 'Pick your country\u2019s fan club and subscribe with a recurring USDC payment through your Solana wallet.',
            },
            {
              step: '02',
              title: 'Predict Matches',
              desc: 'Before every match, submit your scoreline prediction. Only active subscribers can play.',
            },
            {
              step: '03',
              title: 'Climb the Board',
              desc: 'Earn points for correct predictions. Your stats are recorded transparently on-chain.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 text-center"
            >
              <span className="text-emerald-400 text-sm font-bold tracking-wider">
                {item.step}
              </span>
              <h3 className="text-white font-semibold text-lg mt-3 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Squads */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Active Squads</h2>
          <Link
            href="/dashboard"
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            Create Squad &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-slate-800/50 rounded-xl h-48"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">Unable to load squads</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        ) : squads.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/20 border border-dashed border-slate-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-2">No squads yet</p>
            <p className="text-gray-600 text-sm mb-6">
              Be the first to create a World Cup fan squad
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Create First Squad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {squads.map((squad) => (
              <SquadCard
                key={squad.publicKey.toBase58()}
                publicKey={squad.publicKey.toBase58()}
                country={squad.account.country}
                name={squad.account.name}
                memberCount={squad.account.memberCount}
                subscriptionAmount={
                  squad.account.subscriptionAmount?.toNumber?.() ||
                  squad.account.subscriptionAmount
                }
                cadenceSeconds={
                  squad.account.cadenceSeconds?.toNumber?.() ||
                  squad.account.cadenceSeconds
                }
                isActive={squad.account.isActive}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            SquadPass &mdash; Built on Solana
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-xs">
              Devnet demo &bull; Not financial advice
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
