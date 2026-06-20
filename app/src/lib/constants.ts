import { PublicKey } from '@solana/web3.js';

// Placeholder program ID - replace with actual deployed program ID
export const PROGRAM_ID = new PublicKey('SqdP5rWKnBqEjY3HBHA9meEMEW7rGKgMFeeDNa6gqVh');
// Override with NEXT_PUBLIC_RPC_URL env var for a private RPC (Helius, QuickNode, etc.)
// The public devnet endpoint rate-limits aggressively — a private RPC is recommended.
export const DEVNET_URL =
  process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

// Country flag mapping for display
export const COUNTRY_FLAGS: Record<string, string> = {
  'Argentina': '\uD83C\uDDE6\uD83C\uDDF7',
  'Brazil': '\uD83C\uDDE7\uD83C\uDDF7',
  'France': '\uD83C\uDDEB\uD83C\uDDF7',
  'Germany': '\uD83C\uDDE9\uD83C\uDDEA',
  'Spain': '\uD83C\uDDEA\uD83C\uDDF8',
  'England': '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F',
  'Japan': '\uD83C\uDDEF\uD83C\uDDF5',
  'Morocco': '\uD83C\uDDF2\uD83C\uDDE6',
  'USA': '\uD83C\uDDFA\uD83C\uDDF8',
  'Mexico': '\uD83C\uDDF2\uD83C\uDDFD',
  'Portugal': '\uD83C\uDDF5\uD83C\uDDF9',
  'Netherlands': '\uD83C\uDDF3\uD83C\uDDF1',
  'South Korea': '\uD83C\uDDF0\uD83C\uDDF7',
  'Australia': '\uD83C\uDDE6\uD83C\uDDFA',
  'Saudi Arabia': '\uD83C\uDDF8\uD83C\uDDE6',
  'Canada': '\uD83C\uDDE8\uD83C\uDDE6',
  'Italy': '\uD83C\uDDEE\uD83C\uDDF9',
  'Belgium': '\uD83C\uDDE7\uD83C\uDDEA',
  'Croatia': '\uD83C\uDDED\uD83C\uDDF7',
  'Uruguay': '\uD83C\uDDFA\uD83C\uDDFE',
  'Colombia': '\uD83C\uDDE8\uD83C\uDDF4',
  'Senegal': '\uD83C\uDDF8\uD83C\uDDF3',
  'Nigeria': '\uD83C\uDDF3\uD83C\uDDEC',
  'Ghana': '\uD83C\uDDEC\uD83C\uDDED',
};

// Scoring rules
export const SCORING = {
  PREDICTION_SUBMITTED: 1,
  CORRECT_WINNER: 3,
  CORRECT_SCORELINE: 7,
  GROUP_STAGE_BONUS: 5,
  FULL_TOURNAMENT_BONUS: 10,
} as const;
