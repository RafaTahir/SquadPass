import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import idl from './idl/squadpass.json';
import { DEVNET_URL } from './constants';
import {
  getSquadPDA,
  getSubscriptionPDA,
  getLeaderboardPDA,
  getMatchResultPDA,
  getPredictionPDA,
} from './utils';

export type SquadPassProgram = Program;

export function getProgram(provider: AnchorProvider): SquadPassProgram {
  return new Program(idl as any, provider);
}

/** Custom fetch with retry for 429 rate limits */
export const fetchWithRetry: typeof fetch = async (input, init) => {
  const MAX_RETRIES = 4;
  let delay = 500;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(input, init);
    if (res.status === 429 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    return res;
  }
  return fetch(input, init);
};

export function getReadOnlyConnection(): Connection {
  return new Connection(DEVNET_URL, {
    commitment: 'confirmed',
    fetch: fetchWithRetry,
  });
}

export function getReadOnlyProgram(): SquadPassProgram {
  const connection = getReadOnlyConnection();
  const provider = new AnchorProvider(
    connection,
    {} as any, // no wallet needed for reading
    { commitment: 'confirmed' }
  );
  return new Program(idl as any, provider);
}

// ---- Instruction builders ----

export async function buildCreateSquadIx(
  program: SquadPassProgram,
  organizer: PublicKey,
  squadId: BN,
  country: string,
  name: string,
  subscriptionAmount: BN,
  cadenceSeconds: BN,
  tokenMint: PublicKey
) {
  const [squadPda] = getSquadPDA(organizer, squadId);
  const vault = await getAssociatedTokenAddress(tokenMint, squadPda, true);

  return program.methods
    .createSquad(squadId, country, name, subscriptionAmount, cadenceSeconds)
    .accounts({
      organizer,
      squad: squadPda,
      tokenMint,
      vault,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    });
}

export async function buildJoinSquadIx(
  program: SquadPassProgram,
  subscriber: PublicKey,
  squadPda: PublicKey,
  squad: any, // deserialized squad account data
  maxChargeAmount: BN
) {
  const [subscriptionPda] = getSubscriptionPDA(squadPda, subscriber);
  const [leaderboardPda] = getLeaderboardPDA(squadPda, subscriber);
  const subscriberTokenAccount = await getAssociatedTokenAddress(
    squad.tokenMint,
    subscriber
  );

  return program.methods
    .joinSquad(maxChargeAmount)
    .accounts({
      subscriber,
      squad: squadPda,
      subscription: subscriptionPda,
      leaderboardEntry: leaderboardPda,
      subscriberTokenAccount,
      vault: squad.vault,
      squadAuthority: squadPda,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    });
}

export async function buildExecuteBillingIx(
  program: SquadPassProgram,
  cranker: PublicKey,
  squadPda: PublicKey,
  squad: any,
  subscriptionPda: PublicKey,
  subscription: any
) {
  const [leaderboardPda] = getLeaderboardPDA(squadPda, subscription.subscriber);
  const subscriberTokenAccount = await getAssociatedTokenAddress(
    squad.tokenMint,
    subscription.subscriber
  );

  return program.methods
    .executeBilling()
    .accounts({
      cranker,
      squad: squadPda,
      subscription: subscriptionPda,
      leaderboardEntry: leaderboardPda,
      subscriberTokenAccount,
      vault: squad.vault,
      squadAuthority: squadPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    });
}

export async function buildSubmitPredictionIx(
  program: SquadPassProgram,
  subscriber: PublicKey,
  subscriptionPda: PublicKey,
  matchResultPda: PublicKey,
  predictionType: any,
  homeScore: number,
  awayScore: number
) {
  const [predictionPda] = getPredictionPDA(matchResultPda, subscriber);

  return program.methods
    .submitPrediction(predictionType, homeScore, awayScore)
    .accounts({
      subscriber,
      subscription: subscriptionPda,
      matchResult: matchResultPda,
      prediction: predictionPda,
      systemProgram: SystemProgram.programId,
    });
}

export async function buildPostResultIx(
  program: SquadPassProgram,
  authority: PublicKey,
  squadPda: PublicKey,
  matchId: BN,
  homeTeam: string,
  awayTeam: string,
  kickoffTime: BN,
  homeScore: number,
  awayScore: number,
  isFinal: boolean
) {
  const [matchResultPda] = getMatchResultPDA(squadPda, matchId);

  return program.methods
    .postResult(matchId, homeTeam, awayTeam, kickoffTime, homeScore, awayScore, isFinal)
    .accounts({
      authority,
      squad: squadPda,
      matchResult: matchResultPda,
      systemProgram: SystemProgram.programId,
    });
}

export async function buildSettlePredictionIx(
  program: SquadPassProgram,
  settler: PublicKey,
  matchResultPda: PublicKey,
  predictionPda: PublicKey,
  prediction: any
) {
  const [leaderboardPda] = getLeaderboardPDA(prediction.squad, prediction.subscriber);

  return program.methods
    .settlePredictions()
    .accounts({
      settler,
      matchResult: matchResultPda,
      prediction: predictionPda,
      leaderboardEntry: leaderboardPda,
    });
}

export async function buildCancelSubscriptionIx(
  program: SquadPassProgram,
  subscriber: PublicKey,
  squadPda: PublicKey,
  squad: any
) {
  const [subscriptionPda] = getSubscriptionPDA(squadPda, subscriber);
  const subscriberTokenAccount = await getAssociatedTokenAddress(
    squad.tokenMint,
    subscriber
  );

  return program.methods
    .cancelSubscription()
    .accounts({
      subscriber,
      squad: squadPda,
      subscription: subscriptionPda,
      subscriberTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    });
}
