'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/lib/idl/squadpass.json';
import { getSubscriptionPDA } from '@/lib/utils';

export interface SubscriptionAccount {
  subscriber: PublicKey;
  squad: PublicKey;
  nextDueAt: any;
  maxChargeAmount: any;
  billingInterval: any;
  status: any;
  totalPaid: any;
  lastPaidAt: any;
  createdAt: any;
  bump: number;
}

export function useSubscription(squadPda: PublicKey | null) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [subscription, setSubscription] = useState<SubscriptionAccount | null>(null);
  const [subscriptionPda, setSubscriptionPda] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!squadPda || !wallet) {
      setSubscription(null);
      setSubscriptionPda(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [pda] = getSubscriptionPDA(squadPda, wallet.publicKey);
      setSubscriptionPda(pda);

      const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
      const program = new Program(idl as any, provider);

      const account = await (program.account as any).subscription.fetchNullable(pda);
      setSubscription(account as SubscriptionAccount | null);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet, squadPda]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isActive = subscription?.status && 'active' in subscription.status;

  return {
    subscription,
    subscriptionPda,
    isActive,
    loading,
    error,
    refetch: fetchSubscription,
  };
}
