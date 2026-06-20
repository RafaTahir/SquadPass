'use client';

import { FC, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { useSquadPass } from '@/hooks/useSquadPass';

interface MatchResultFormProps {
  squadPda: PublicKey;
  onSuccess?: () => void;
}

export const MatchResultForm: FC<MatchResultFormProps> = ({
  squadPda,
  onSuccess,
}) => {
  const { postMatchResult, connected } = useSquadPass();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    matchId: '',
    homeTeam: '',
    awayTeam: '',
    kickoffTime: '',
    homeScore: '0',
    awayScore: '0',
    isFinal: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      toast.error('Connect your wallet first');
      return;
    }

    try {
      setLoading(true);

      const kickoffTimestamp = Math.floor(
        new Date(form.kickoffTime).getTime() / 1000
      );

      await postMatchResult({
        squadPda,
        matchId: Number(form.matchId),
        homeTeam: form.homeTeam,
        awayTeam: form.awayTeam,
        kickoffTime: kickoffTimestamp,
        homeScore: Number(form.homeScore),
        awayScore: Number(form.awayScore),
        isFinal: form.isFinal,
      });

      setForm({
        matchId: '',
        homeTeam: '',
        awayTeam: '',
        kickoffTime: '',
        homeScore: '0',
        awayScore: '0',
        isFinal: false,
      });
      onSuccess?.();
    } catch (err: any) {
      console.error('Post result error:', err);
      toast.error(err.message || 'Failed to post result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-white font-semibold text-lg mb-4">Post Match Result</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm block mb-1">Match ID</label>
          <input
            type="number"
            value={form.matchId}
            onChange={(e) => setForm({ ...form, matchId: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Home Team</label>
            <input
              type="text"
              value={form.homeTeam}
              onChange={(e) => setForm({ ...form, homeTeam: e.target.value })}
              placeholder="Argentina"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Away Team</label>
            <input
              type="text"
              value={form.awayTeam}
              onChange={(e) => setForm({ ...form, awayTeam: e.target.value })}
              placeholder="Brazil"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Kickoff Time</label>
          <input
            type="datetime-local"
            value={form.kickoffTime}
            onChange={(e) => setForm({ ...form, kickoffTime: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Home Score</label>
            <input
              type="number"
              min="0"
              max="99"
              value={form.homeScore}
              onChange={(e) => setForm({ ...form, homeScore: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Away Score</label>
            <input
              type="number"
              min="0"
              max="99"
              value={form.awayScore}
              onChange={(e) => setForm({ ...form, awayScore: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFinal"
            checked={form.isFinal}
            onChange={(e) => setForm({ ...form, isFinal: e.target.checked })}
            className="accent-emerald-500"
          />
          <label htmlFor="isFinal" className="text-gray-400 text-sm">
            Mark as final result
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !connected}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? 'Posting...' : 'Post Result'}
        </button>
      </form>
    </div>
  );
};
