'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/lib/idl/squadpass.json';

export interface PredictionAccount {
  publicKey: PublicKey;
  account: {
    matchId: any;
    subscriber: PublicKey;
    squad: PublicKey;
    predictionType: any;
    homeScore: number;
    awayScore: number;
    submittedAt: any;
    isSettled: boolean;
    pointsAwarded: number;
    bump: number;
  };
}

export interface MatchResultAccount {
  publicKey: PublicKey;
  account: {
    matchId: any;
    homeTeam: string;
    awayTeam: string;
    kickoffTime: any;
    homeScore: number;
    awayScore: number;
    isFinal: boolean;
    resultAuthority: PublicKey;
    squad: PublicKey;
    bump: number;
  };
}

export function usePredictions(squadPda: PublicKey | null) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [predictions, setPredictions] = useState<PredictionAccount[]>([]);
  const [matches, setMatches] = useState<MatchResultAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!squadPda) {
      setPredictions([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const provider = new AnchorProvider(
        connection,
        wallet || ({} as any),
        { commitment: 'confirmed' }
      );
      const program = new Program(idl as any, provider);

      // Fetch all matches and filter by squad client-side
      // (memcmp won't work because String fields have variable-length Borsh encoding)
      const allMatches = await (program.account as any).matchResult.all();
      const filteredMatches = allMatches.filter(
        (a: any) => a.account.squad.equals(squadPda)
      );

      setMatches(
        filteredMatches.map((a: any) => ({
          publicKey: a.publicKey,
          account: a.account as any,
        }))
      );

      // Fetch predictions by current user if connected
      if (wallet) {
        const predAccounts = await (program.account as any).prediction.all([
          {
            memcmp: {
              offset: 8 + 8, // After discriminator + matchId
              bytes: wallet.publicKey.toBase58(),
            },
          },
        ]);

        setPredictions(
          predAccounts
            .filter((a: any) => a.account.squad.equals(squadPda))
            .map((a: any) => ({
              publicKey: a.publicKey,
              account: a.account as any,
            }))
        );
      }
    } catch (err) {
      console.error('Error fetching predictions/matches:', err);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, squadPda]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { predictions, matches, loading, refetch: fetchData };
}
