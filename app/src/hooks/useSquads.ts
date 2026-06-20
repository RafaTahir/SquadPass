'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/lib/idl/squadpass.json';

export interface SquadAccount {
  publicKey: PublicKey;
  account: {
    squadId: any;
    organizer: PublicKey;
    country: string;
    name: string;
    subscriptionAmount: any;
    tokenMint: PublicKey;
    cadenceSeconds: any;
    vault: PublicKey;
    isActive: boolean;
    memberCount: number;
    createdAt: any;
    bump: number;
  };
}

export function useSquads() {
  const { connection } = useConnection();
  const [squads, setSquads] = useState<SquadAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSquads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new AnchorProvider(
        connection,
        {} as any,
        { commitment: 'confirmed' }
      );
      const program = new Program(idl as any, provider);

      const accounts = await (program.account as any).squad.all();
      setSquads(
        accounts.map((a: any) => ({
          publicKey: a.publicKey,
          account: a.account as any,
        }))
      );
    } catch (err: any) {
      console.error('Error fetching squads:', err);
      setError(err.message || 'Failed to fetch squads');
      setSquads([]);
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchSquads();
  }, [fetchSquads]);

  return { squads, loading, error, refetch: fetchSquads };
}
