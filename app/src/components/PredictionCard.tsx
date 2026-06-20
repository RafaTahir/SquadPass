'use client';

import { FC, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { useSquadPass } from '@/hooks/useSquadPass';
import { formatDate, timeUntil } from '@/lib/utils';

interface PredictionCardProps {
  matchPda: PublicKey;
  match: {
    matchId: any;
    homeTeam: string;
    awayTeam: string;
    kickoffTime: any;
    homeScore: number;
    awayScore: number;
    isFinal: boolean;
  };
  subscriptionPda: PublicKey;
  existingPrediction?: {
    homeScore: number;
    awayScore: number;
    isSettled: boolean;
    pointsAwarded: number;
  } | null;
  onSuccess?: () => void;
}

export const PredictionCard: FC<PredictionCardProps> = ({
  matchPda,
  match,
  subscriptionPda,
  existingPrediction,
  onSuccess,
}) => {
  const { submitPrediction, connected } = useSquadPass();
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const kickoff = match.kickoffTime?.toNumber?.() || match.kickoffTime;
  const now = Math.floor(Date.now() / 1000);
  const isLocked = now >= kickoff;
  const hasPredicted = !!existingPrediction;

  const handleSubmit = async () => {
    if (!connected) {
      toast.error('Connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      await submitPrediction(
        subscriptionPda,
        matchPda,
        { scoreline: {} },
        homeScore,
        awayScore
      );
      onSuccess?.();
    } catch (err: any) {
      console.error('Prediction error:', err);
      toast.error(err.message || 'Failed to submit prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      {/* Match header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500">
          Match #{match.matchId?.toNumber?.() || match.matchId}
        </span>
        {match.isFinal ? (
          <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
            Final
          </span>
        ) : isLocked ? (
          <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
            Locked
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
            Open - {timeUntil(kickoff)}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center flex-1">
          <p className="text-white font-semibold">{match.homeTeam}</p>
        </div>
        <div className="px-4">
          {match.isFinal ? (
            <span className="text-2xl font-bold text-amber-400">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-gray-600 text-sm font-medium">VS</span>
          )}
        </div>
        <div className="text-center flex-1">
          <p className="text-white font-semibold">{match.awayTeam}</p>
        </div>
      </div>

      <p className="text-gray-500 text-xs text-center mb-4">
        Kickoff: {formatDate(kickoff)}
      </p>

      {/* Prediction area */}
      {hasPredicted ? (
        <div className="bg-slate-900/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">Your Prediction</p>
          <p className="text-white font-bold text-lg">
            {existingPrediction!.homeScore} - {existingPrediction!.awayScore}
          </p>
          {existingPrediction!.isSettled && (
            <p className="text-amber-400 text-sm font-medium mt-1">
              +{existingPrediction!.pointsAwarded} pts
            </p>
          )}
        </div>
      ) : isLocked ? (
        <div className="bg-slate-900/50 rounded-lg p-3 text-center">
          <p className="text-gray-500 text-sm">Prediction window closed</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                className="w-8 h-8 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <span className="text-white font-bold text-xl w-8 text-center">
                {homeScore}
              </span>
              <button
                onClick={() => setHomeScore(Math.min(15, homeScore + 1))}
                className="w-8 h-8 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
            <span className="text-gray-600">-</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                className="w-8 h-8 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <span className="text-white font-bold text-xl w-8 text-center">
                {awayScore}
              </span>
              <button
                onClick={() => setAwayScore(Math.min(15, awayScore + 1))}
                className="w-8 h-8 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !connected}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Submitting...' : 'Submit Prediction'}
          </button>
        </div>
      )}
    </div>
  );
};
