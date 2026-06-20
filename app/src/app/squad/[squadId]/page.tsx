'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { COUNTRY_FLAGS } from '@/lib/constants';
import idl from '@/lib/idl/squadpass.json';
import { formatTokenAmount, formatCadence, truncateAddress } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { usePredictions } from '@/hooks/usePredictions';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { JoinSquadModal } from '@/components/JoinSquadModal';
import { PredictionCard } from '@/components/PredictionCard';
import { useSquadPass } from '@/hooks/useSquadPass';

export default function SquadDetailPage() {
  const params = useParams();
  const squadId = params.squadId as string;
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [squad, setSquad] = useState<any>(null);
  const [squadPda, setSquadPda] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { subscription, subscriptionPda, isActive } = useSubscription(squadPda);
  const { predictions, matches, refetch: refetchPredictions } = usePredictions(squadPda);
  const { cancelSubscription } = useSquadPass();

  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const fetchSquad = useCallback(async () => {
    try {
      setLoading(true);
      const pda = new PublicKey(squadId);
      setSquadPda(pda);

      const provider = new AnchorProvider(
        connection,
        walletRef.current || ({} as any),
        { commitment: 'confirmed' }
      );
      const program = new Program(idl as any, provider);
      const account = await (program.account as any).squad.fetch(pda);
      setSquad(account);
    } catch (err) {
      console.error('Error fetching squad:', err);
    } finally {
      setLoading(false);
    }
  }, [squadId, connection]);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-800 rounded-lg w-1/3" />
          <div className="h-6 bg-slate-800 rounded-lg w-1/2" />
          <div className="h-48 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400 text-lg">Squad not found</p>
        <Link
          href="/"
          className="text-emerald-400 hover:text-emerald-300 text-sm mt-4 inline-block"
        >
          &larr; Back to squads
        </Link>
      </div>
    );
  }

  const flag = COUNTRY_FLAGS[squad.country] || '\u26BD';
  const subAmount = squad.subscriptionAmount?.toNumber?.() || squad.subscriptionAmount;
  const cadence = squad.cadenceSeconds?.toNumber?.() || squad.cadenceSeconds;

  const getStatus = (): 'active' | 'cancelled' | 'paused' | 'none' => {
    if (!subscription) return 'none';
    if (subscription.status?.active !== undefined) return 'active';
    if (subscription.status?.cancelled !== undefined) return 'cancelled';
    if (subscription.status?.paused !== undefined) return 'paused';
    return 'none';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="text-gray-500 hover:text-white text-sm transition-colors mb-6 inline-block"
      >
        &larr; Back to squads
      </Link>

      {/* Squad header */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{flag}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">{squad.name}</h1>
              <p className="text-gray-400 text-sm">{squad.country}</p>
            </div>
          </div>
          <SubscriptionBadge status={getStatus()} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
          <div>
            <p className="text-gray-500 text-xs">Members</p>
            <p className="text-white font-semibold">{squad.memberCount}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Subscription</p>
            <p className="text-white font-semibold">
              {formatTokenAmount(subAmount)} USDC
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Cadence</p>
            <p className="text-white font-semibold">
              Every {formatCadence(cadence)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Organizer</p>
            <p className="text-white font-semibold font-mono text-sm">
              {truncateAddress(squad.organizer.toBase58())}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {getStatus() === 'none' && (
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Join Squad
            </button>
          )}
          <Link
            href={`/leaderboard/${squadId}`}
            className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            View Leaderboard
          </Link>
          {isActive && (
            <button
              onClick={async () => {
                try {
                  await cancelSubscription(squadPda!, squad);
                  fetchSquad();
                } catch (_err) {
                  // error already toasted by hook
                }
              }}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium px-6 py-2.5 rounded-xl transition-colors text-sm border border-red-500/30"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Subscription info */}
      {subscription && isActive && (
        <div className="bg-slate-800/30 border border-emerald-500/20 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-xs">Total Paid</p>
              <p className="text-white font-semibold">
                {formatTokenAmount(
                  subscription.totalPaid?.toNumber?.() || 0
                )}{' '}
                USDC
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Next Due</p>
              <p className="text-white font-semibold">
                {new Date(
                  (subscription.nextDueAt?.toNumber?.() || 0) * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Last Paid</p>
              <p className="text-white font-semibold">
                {new Date(
                  (subscription.lastPaidAt?.toNumber?.() || 0) * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Status</p>
              <p className="text-emerald-400 font-semibold">Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Matches & Predictions */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">
          Matches & Predictions
        </h2>

        {matches.length === 0 ? (
          <div className="bg-slate-800/20 border border-dashed border-slate-700 rounded-xl p-8 text-center">
            <p className="text-gray-400">No matches posted yet</p>
            <p className="text-gray-600 text-sm mt-1">
              The organizer will post matches before kickoff
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => {
              const matchId =
                match.account.matchId?.toNumber?.() ||
                match.account.matchId;
              const existingPred = predictions.find(
                (p) =>
                  (p.account.matchId?.toNumber?.() ||
                    p.account.matchId) === matchId
              );

              return isActive && subscriptionPda ? (
                <PredictionCard
                  key={match.publicKey.toBase58()}
                  matchPda={match.publicKey}
                  match={match.account}
                  subscriptionPda={subscriptionPda}
                  existingPrediction={
                    existingPred ? existingPred.account : null
                  }
                  onSuccess={refetchPredictions}
                />
              ) : (
                <div
                  key={match.publicKey.toBase58()}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500">
                      Match #{match.account.matchId?.toNumber?.() || match.account.matchId}
                    </span>
                    {match.account.isFinal ? (
                      <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                        Final
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="text-white font-semibold">{match.account.homeTeam}</p>
                    </div>
                    <div className="px-4">
                      {match.account.isFinal ? (
                        <span className="text-2xl font-bold text-amber-400">
                          {match.account.homeScore} - {match.account.awayScore}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm font-medium">VS</span>
                      )}
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-white font-semibold">{match.account.awayTeam}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <p className="text-gray-500 text-sm">Subscribe to unlock predictions</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Join Modal */}
      {squadPda && (
        <JoinSquadModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          squadPda={squadPda}
          squad={squad}
          onSuccess={() => {
            fetchSquad();
          }}
        />
      )}
    </div>
  );
}
