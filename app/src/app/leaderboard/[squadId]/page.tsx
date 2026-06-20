'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { COUNTRY_FLAGS } from '@/lib/constants';
import idl from '@/lib/idl/squadpass.json';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { LeaderboardTable } from '@/components/LeaderboardTable';

export default function LeaderboardPage() {
  const params = useParams();
  const squadId = params.squadId as string;
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [squad, setSquad] = useState<any>(null);
  const [squadPda, setSquadPda] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);

  const { entries, loading: lbLoading } = useLeaderboard(squadPda);

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
          <div className="h-64 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const flag = squad ? COUNTRY_FLAGS[squad.country] || '\u26BD' : '\u26BD';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/squad/${squadId}`}
        className="text-gray-500 hover:text-white text-sm transition-colors mb-6 inline-block"
      >
        &larr; Back to squad
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-3xl">{flag}</span>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {squad?.name || 'Squad'} Leaderboard
          </h1>
          <p className="text-gray-500 text-sm">{squad?.country || ''}</p>
        </div>
      </div>

      {/* Scoring rules */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 mb-8">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Scoring Rules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-amber-400 font-bold">+1</p>
            <p className="text-gray-500 text-xs">Submit prediction</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-amber-400 font-bold">+3</p>
            <p className="text-gray-500 text-xs">Correct winner</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-amber-400 font-bold">+7</p>
            <p className="text-gray-500 text-xs">Exact scoreline</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-emerald-400 font-bold">+5</p>
            <p className="text-gray-500 text-xs">Group stage bonus</p>
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <LeaderboardTable entries={entries} loading={lbLoading} />
      </div>
    </div>
  );
}
