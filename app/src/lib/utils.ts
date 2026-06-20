import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';

/**
 * Derive Squad PDA
 */
export function getSquadPDA(organizer: PublicKey, squadId: number | BN): [PublicKey, number] {
  const id = typeof squadId === 'number' ? new BN(squadId) : squadId;
  return PublicKey.findProgramAddressSync(
    [Buffer.from('squad'), organizer.toBuffer(), id.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

/**
 * Derive Subscription PDA
 */
export function getSubscriptionPDA(squad: PublicKey, subscriber: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('subscription'), squad.toBuffer(), subscriber.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive LeaderboardEntry PDA
 */
export function getLeaderboardPDA(squad: PublicKey, subscriber: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('leaderboard'), squad.toBuffer(), subscriber.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive MatchResult PDA
 */
export function getMatchResultPDA(squad: PublicKey, matchId: number | BN): [PublicKey, number] {
  const id = typeof matchId === 'number' ? new BN(matchId) : matchId;
  return PublicKey.findProgramAddressSync(
    [Buffer.from('match'), squad.toBuffer(), id.toArrayLike(Buffer, 'le', 8)],
    PROGRAM_ID
  );
}

/**
 * Derive Prediction PDA
 */
export function getPredictionPDA(matchResult: PublicKey, subscriber: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('prediction'), matchResult.toBuffer(), subscriber.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Truncate a wallet address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format lamports/token amount to human-readable
 */
export function formatTokenAmount(amount: number | BN, decimals = 6): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return (num / Math.pow(10, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a unix timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get Solana Explorer URL for a transaction
 */
export function getExplorerUrl(signature: string, cluster = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Get Solana Explorer URL for an account
 */
export function getAccountExplorerUrl(address: string, cluster = 'devnet'): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}

/**
 * Format cadence seconds to human-readable period
 */
export function formatCadence(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`;
  if (seconds < 604800) return `${Math.round(seconds / 86400)} day`;
  return `${Math.round(seconds / 604800)} week`;
}

/**
 * Calculate time until next event
 */
export function timeUntil(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  if (diff <= 0) return 'Now';
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
}
