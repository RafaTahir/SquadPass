'use client';

import { FC, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { useSquadPass } from '@/hooks/useSquadPass';
import { formatTokenAmount, formatCadence } from '@/lib/utils';

interface JoinSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  squadPda: PublicKey;
  squad: any;
  onSuccess?: () => void;
}

export const JoinSquadModal: FC<JoinSquadModalProps> = ({
  isOpen,
  onClose,
  squadPda,
  squad,
  onSuccess,
}) => {
  const { joinSquad, connected } = useSquadPass();
  const [loading, setLoading] = useState(false);
  const [multiplier, setMultiplier] = useState(10);

  if (!isOpen) return null;

  const maxCharge = (squad.subscriptionAmount?.toNumber?.() || squad.subscriptionAmount) * multiplier;
  const subAmount = squad.subscriptionAmount?.toNumber?.() || squad.subscriptionAmount;
  const cadence = squad.cadenceSeconds?.toNumber?.() || squad.cadenceSeconds;

  const handleJoin = async () => {
    if (!connected) {
      toast.error('Connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      await joinSquad(squadPda, squad, maxCharge);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Join error:', err);
      toast.error(err.message || 'Failed to join squad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Join {squad.name}</h2>
        <p className="text-gray-400 text-sm mb-6">
          Subscribe to this squad with recurring payments
        </p>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Subscription amount</span>
              <span className="text-white font-semibold">
                {formatTokenAmount(subAmount)} USDC
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Billing cadence</span>
              <span className="text-white font-semibold">
                Every {formatCadence(cadence)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">First payment</span>
              <span className="text-emerald-400 font-semibold">
                {formatTokenAmount(subAmount)} USDC
              </span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4">
            <label className="text-gray-400 text-sm block mb-2">
              Max recurring charge approval ({multiplier}x subscription)
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <p className="text-white text-sm mt-1">
              Max: {formatTokenAmount(maxCharge)} USDC
            </p>
            <p className="text-gray-500 text-xs mt-1">
              This caps the total amount the program can charge over time.
              You can cancel anytime.
            </p>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || !connected}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Joining...
            </span>
          ) : (
            `Pay ${formatTokenAmount(subAmount)} USDC & Join`
          )}
        </button>

        <p className="text-gray-500 text-xs text-center mt-3">
          By joining, you approve a recurring payment delegation to the SquadPass program.
        </p>
      </div>
    </div>
  );
};
