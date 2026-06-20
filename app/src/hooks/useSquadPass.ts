'use client';

import { useCallback, useMemo } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';
import {
  getProgram,
  buildCreateSquadIx,
  buildJoinSquadIx,
  buildExecuteBillingIx,
  buildSubmitPredictionIx,
  buildPostResultIx,
  buildSettlePredictionIx,
  buildCancelSubscriptionIx,
} from '@/lib/program';
import { getExplorerUrl } from '@/lib/utils';

export function useSquadPass() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return getProgram(provider);
  }, [provider]);

  const createSquad = useCallback(
    async (params: {
      squadId: number;
      country: string;
      name: string;
      subscriptionAmount: number;
      cadenceSeconds: number;
      tokenMint: PublicKey;
    }) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      const squadId = new BN(params.squadId);
      const subscriptionAmount = new BN(params.subscriptionAmount);
      const cadenceSeconds = new BN(params.cadenceSeconds);

      try {
        const ix = await buildCreateSquadIx(
          program,
          wallet.publicKey,
          squadId,
          params.country,
          params.name,
          subscriptionAmount,
          cadenceSeconds,
          params.tokenMint
        );

        const sig = await ix.rpc();
        toast.success('Squad created!');
        console.log('Create squad tx:', getExplorerUrl(sig));
        return sig;
      } catch (err: any) {
        console.error('Create squad error:', err);
        toast.error(err.message || 'Failed to create squad');
        throw err;
      }
    },
    [program, wallet]
  );

  const joinSquad = useCallback(
    async (squadPda: PublicKey, squad: any, maxChargeAmount: number) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      try {
        const ix = await buildJoinSquadIx(
          program,
          wallet.publicKey,
          squadPda,
          squad,
          new BN(maxChargeAmount)
        );

        const sig = await ix.rpc();
        toast.success('Joined squad!');
        console.log('Join squad tx:', getExplorerUrl(sig));
        return sig;
      } catch (err: any) {
        console.error('Join squad error:', err);
        toast.error(err.message || 'Failed to join squad');
        throw err;
      }
    },
    [program, wallet]
  );

  const executeBilling = useCallback(
    async (
      squadPda: PublicKey,
      squad: any,
      subscriptionPda: PublicKey,
      subscription: any
    ) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      try {
        const ix = await buildExecuteBillingIx(
          program,
          wallet.publicKey,
          squadPda,
          squad,
          subscriptionPda,
          subscription
        );

        const sig = await ix.rpc();
        toast.success('Billing executed!');
        console.log('Execute billing tx:', getExplorerUrl(sig));
        return sig;
      } catch (err: any) {
        console.error('Execute billing error:', err);
        toast.error(err.message || 'Failed to execute billing');
        throw err;
      }
    },
    [program, wallet]
  );

  const submitPrediction = useCallback(
    async (
      subscriptionPda: PublicKey,
      matchResultPda: PublicKey,
      predictionType: any,
      homeScore: number,
      awayScore: number
    ) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      try {
        const ix = await buildSubmitPredictionIx(
          program,
          wallet.publicKey,
          subscriptionPda,
          matchResultPda,
          predictionType,
          homeScore,
          awayScore
        );

        const sig = await ix.rpc();
        toast.success('Prediction submitted!');
        console.log('Submit prediction tx:', getExplorerUrl(sig));
        return sig;
      } catch (err: any) {
        console.error('Submit prediction error:', err);
        toast.error(err.message || 'Failed to submit prediction');
        throw err;
      }
    },
    [program, wallet]
  );

  const postMatchResult = useCallback(
    async (params: {
      squadPda: PublicKey;
      matchId: number;
      homeTeam: string;
      awayTeam: string;
      kickoffTime: number;
      homeScore: number;
      awayScore: number;
      isFinal: boolean;
    }) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      try {
        const ix = await buildPostResultIx(
          program,
          wallet.publicKey,
          params.squadPda,
          new BN(params.matchId),
          params.homeTeam,
          params.awayTeam,
          new BN(params.kickoffTime),
          params.homeScore,
          params.awayScore,
          params.isFinal
        );

        const sig = await ix.rpc();
        toast.success('Match result posted!');
        console.log('Post result tx:', getExplorerUrl(sig));
        return sig;
      } catch (err: any) {
        console.error('Post match result error:', err);
        toast.error(err.message || 'Failed to post match result');
        throw err;
      }
    },
    [program, wallet]
  );

  const settlePrediction = useCallback(
    async (
      matchResultPda: PublicKey,
      predictionPda: PublicKey,
      prediction: any
    ) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      try {
        const ix = await buildSettlePredictionIx(
          program,
          wallet.publicKey,
          matchResultPda,
          predictionPda,
          prediction
        );

        const sig = await ix.rpc();
        toast.success('Prediction settled!');
        console.log('Settle prediction tx:', getExplorerUrl(sig));
        return sig;
      } catch (err: any) {
        console.error('Settle prediction error:', err);
        toast.error(err.message || 'Failed to settle prediction');
        throw err;
      }
    },
    [program, wallet]
  );

  const cancelSubscription = useCallback(
    async (squadPda: PublicKey, squad: any) => {
      if (!program || !wallet) throw new Error('Wallet not connected');

      try {
        const ix = await buildCancelSubscriptionIx(
          program,
          wallet.publicKey,
          squadPda,
          squad
        );

        const sig = await ix.rpc();
        toast.success('Subscription cancelled');
        console.log('Cancel subscription tx:', getExplorerUrl(sig));
        return sig;
      } catch (err: any) {
        console.error('Cancel subscription error:', err);
        toast.error(err.message || 'Failed to cancel subscription');
        throw err;
      }
    },
    [program, wallet]
  );

  return {
    program,
    provider,
    connected: !!wallet,
    publicKey: wallet?.publicKey || null,
    createSquad,
    joinSquad,
    executeBilling,
    submitPrediction,
    postMatchResult,
    settlePrediction,
    cancelSubscription,
  };
}
