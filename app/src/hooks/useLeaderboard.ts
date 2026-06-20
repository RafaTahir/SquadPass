'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/lib/idl/squadpass.json';

export interface LeaderboardAccount {
  publicKey: PublicKey;
  account: {
    subscriber: PublicKey;
    squad: PublicKey;
    totalPoints: number;
    matchesPredicted: number;
    correctWinners: number;
    correctScorelines: number;
    paidCycles: number;
    currentStreak: number;
    bump: number;
  };
}

export function useLeaderboard(squadPda: PublicKey | null) {
  const { connection } = useConnection();
  const [entries, setEntries] = useState<LeaderboardAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    if (!squadPda) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const provider = new AnchorProvider(
        connection,
        {} as any,
        { commitment: 'confirmed' }
      );
      const program = new Program(idl as any, provider);

      // Fetch all leaderboard entries and filter by squad
      const accounts = await (program.account as any).leaderboardEntry.all([
        {
          memcmp: {
            offset: 40, // After discriminator (8) + subscriber pubkey (32)
            bytes: squadPda.toBase58(),
          },
        },
      ]);

      const sorted = accounts
        .map((a: any) => ({
          publicKey: a.publicKey,
          account: a.account as any,
        }))
        .sort((a: any, b: any) => b.account.totalPoints - a.account.totalPoints);

      setEntries(sorted);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [connection, squadPda]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, loading, refetch: fetchLeaderboard };
}
