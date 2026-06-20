'use client';

import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { truncateAddress } from '@/lib/utils';
import type { LeaderboardAccount } from '@/hooks/useLeaderboard';

const toNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toNumber === 'function') return val.toNumber();
  return Number(val) || 0;
};

interface LeaderboardTableProps {
  entries: LeaderboardAccount[];
  loading: boolean;
}

export const LeaderboardTable: FC<LeaderboardTableProps> = ({
  entries,
  loading,
}) => {
  const { publicKey } = useWallet();

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-800 rounded-lg" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No leaderboard entries yet</p>
        <p className="text-gray-600 text-sm mt-1">
          Join the squad and submit predictions to appear here
        </p>
      </div>
    );
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 2:
        return 'text-gray-300 bg-gray-400/10 border-gray-400/30';
      case 3:
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      default:
        return 'text-gray-400 bg-slate-800/50 border-slate-700/50';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left text-gray-500 text-xs font-medium py-3 px-3">
              Rank
            </th>
            <th className="text-left text-gray-500 text-xs font-medium py-3 px-3">
              Player
            </th>
            <th className="text-right text-gray-500 text-xs font-medium py-3 px-3">
              Points
            </th>
            <th className="text-right text-gray-500 text-xs font-medium py-3 px-3 hidden sm:table-cell">
              Matches
            </th>
            <th className="text-right text-gray-500 text-xs font-medium py-3 px-3 hidden md:table-cell">
              Winners
            </th>
            <th className="text-right text-gray-500 text-xs font-medium py-3 px-3 hidden md:table-cell">
              Exact
            </th>
            <th className="text-right text-gray-500 text-xs font-medium py-3 px-3 hidden lg:table-cell">
              Streak
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = publicKey?.equals(entry.account.subscriber);

            return (
              <tr
                key={entry.publicKey.toBase58()}
                className={`border-b border-slate-800/50 ${
                  isCurrentUser ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'
                } transition-colors`}
              >
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${getRankStyle(
                      rank
                    )}`}
                  >
                    {rank}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`text-sm font-mono ${
                      isCurrentUser ? 'text-emerald-400 font-semibold' : 'text-white'
                    }`}
                  >
                    {truncateAddress(entry.account.subscriber.toBase58())}
                    {isCurrentUser && (
                      <span className="text-xs text-emerald-500 ml-2">(you)</span>
                    )}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-white font-bold text-sm">
                    {toNum(entry.account.totalPoints)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right hidden sm:table-cell">
                  <span className="text-gray-400 text-sm">
                    {toNum(entry.account.matchesPredicted)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right hidden md:table-cell">
                  <span className="text-gray-400 text-sm">
                    {toNum(entry.account.correctWinners)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right hidden md:table-cell">
                  <span className="text-gray-400 text-sm">
                    {toNum(entry.account.correctScorelines)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right hidden lg:table-cell">
                  <span className="text-amber-400 text-sm">
                    {toNum(entry.account.currentStreak)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
