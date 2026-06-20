'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useConnection, useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { COUNTRY_FLAGS } from '@/lib/constants';
import idl from '@/lib/idl/squadpass.json';
import { useSquadPass } from '@/hooks/useSquadPass';
import { BillingPanel } from '@/components/BillingPanel';
import { MatchResultForm } from '@/components/MatchResultForm';
import { formatTokenAmount, formatCadence, truncateAddress } from '@/lib/utils';

const WalletMultiButton = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

// Devnet USDC-dev mint (from spl-token-faucet). Replace with your own devnet token.
const DEMO_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export default function DashboardPage() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const { createSquad, settlePrediction } = useSquadPass();

  const [mySquads, setMySquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({
    country: 'Argentina',
    name: '',
    subscriptionAmount: '1000000',
    cadenceSeconds: '604800',
    tokenMint: DEMO_MINT,
  });

  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const fetchMySquads = useCallback(async () => {
    if (!walletRef.current) {
      setMySquads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const provider = new AnchorProvider(connection, walletRef.current, {
        commitment: 'confirmed',
      });
      const program = new Program(idl as any, provider);

      const accounts = await (program.account as any).squad.all([
        {
          memcmp: {
            offset: 8 + 8, // After discriminator + squadId
            bytes: walletRef.current.publicKey.toBase58(),
          },
        },
      ]);

      const mapped = accounts.map((a: any) => ({
        publicKey: a.publicKey,
        account: a.account,
      }));
      
      setMySquads(mapped);
      
      if (mapped.length > 0) {
        setSelectedSquad((prev: any) => prev || mapped[0]);
      }
    } catch (err) {
      console.error('Error fetching squads:', err);
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchMySquads();
  }, [fetchMySquads, wallet?.publicKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      toast.error('Connect your wallet first');
      return;
    }

    try {
      setCreating(true);
      const squadId = Date.now() + Math.floor(Math.random() * 10000);

      await createSquad({
        squadId,
        country: form.country,
        name: form.name,
        subscriptionAmount: Number(form.subscriptionAmount),
        cadenceSeconds: Number(form.cadenceSeconds),
        tokenMint: new PublicKey(form.tokenMint),
      });

      setShowCreateForm(false);
      setForm({
        country: 'Argentina',
        name: '',
        subscriptionAmount: '1000000',
        cadenceSeconds: '604800',
        tokenMint: DEMO_MINT,
      });
      fetchMySquads();
    } catch (err: any) {
      console.error('Create squad error:', err);
      toast.error(err.message || 'Failed to create squad');
    } finally {
      setCreating(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Organizer Dashboard
        </h1>
        <p className="text-gray-400 mb-8">
          Connect your wallet to manage your squads
        </p>
        <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-500 !rounded-xl !h-12 !text-base !font-semibold !px-8" />
      </div>
    );
  }

  const countries = Object.keys(COUNTRY_FLAGS);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Organizer Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your squads, billing, and match results
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
        >
          {showCreateForm ? 'Cancel' : '+ Create Squad'}
        </button>
      </div>

      {/* Create squad form */}
      {showCreateForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Create New Squad
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Country
                </label>
                <select
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {COUNTRY_FLAGS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Squad Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="KL Argentina Fans"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  required
                  maxLength={64}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Subscription Amount (token units)
                </label>
                <input
                  type="number"
                  value={form.subscriptionAmount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subscriptionAmount: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  required
                />
                <p className="text-gray-600 text-xs mt-1">
                  1,000,000 = 1 USDC (6 decimals)
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">
                  Billing Cadence
                </label>
                <select
                  value={form.cadenceSeconds}
                  onChange={(e) =>
                    setForm({ ...form, cadenceSeconds: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="300">Every 5 min (demo)</option>
                  <option value="3600">Every hour</option>
                  <option value="86400">Daily</option>
                  <option value="259200">Every 3 days</option>
                  <option value="604800">Weekly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-1">
                Token Mint Address
              </label>
              <input
                type="text"
                value={form.tokenMint}
                onChange={(e) =>
                  setForm({ ...form, tokenMint: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none"
                required
              />
              <p className="text-gray-600 text-xs mt-1">
                Use a devnet SPL token mint address
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              {creating ? 'Creating...' : 'Create Squad'}
            </button>
          </form>
        </div>
      )}

      {/* Squad selector */}
      {mySquads.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {mySquads.map((s) => (
            <button
              key={s.publicKey.toBase58()}
              onClick={() => setSelectedSquad(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSquad?.publicKey.equals(s.publicKey)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              {COUNTRY_FLAGS[s.account.country] || '\u26BD'}{' '}
              {s.account.name}
            </button>
          ))}
        </div>
      )}

      {/* Dashboard content */}
      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-slate-800 rounded-xl" />
          <div className="h-48 bg-slate-800 rounded-xl" />
        </div>
      ) : mySquads.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 border border-dashed border-slate-700 rounded-xl">
          <p className="text-gray-400 text-lg mb-2">
            You haven&apos;t created any squads yet
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Create your first squad to start managing a fan club
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Create First Squad
          </button>
        </div>
      ) : selectedSquad ? (
        <div className="space-y-8">
          {/* Squad overview */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">
                {COUNTRY_FLAGS[selectedSquad.account.country] || '\u26BD'}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedSquad.account.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  {selectedSquad.account.country}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-700/50">
              <div>
                <p className="text-gray-500 text-xs">Members</p>
                <p className="text-white font-semibold text-lg">
                  {selectedSquad.account.memberCount}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Price</p>
                <p className="text-white font-semibold">
                  {formatTokenAmount(
                    selectedSquad.account.subscriptionAmount?.toNumber?.() || 0
                  )}{' '}
                  USDC
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Cadence</p>
                <p className="text-white font-semibold">
                  {formatCadence(
                    selectedSquad.account.cadenceSeconds?.toNumber?.() || 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">PDA</p>
                <p className="text-white font-mono text-xs">
                  {truncateAddress(selectedSquad.publicKey.toBase58(), 6)}
                </p>
              </div>
            </div>
          </div>

          {/* Billing */}
          <BillingPanel
            squadPda={selectedSquad.publicKey}
            squad={selectedSquad.account}
          />

          {/* Post match result */}
          <MatchResultForm
            squadPda={selectedSquad.publicKey}
            onSuccess={() => {}}
          />

          {/* Settle Predictions */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Settle Predictions</h3>
              <button
                onClick={async () => {
                  if (!wallet) return;
                  try {
                    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
                    const program = new Program(idl as any, provider);
                    
                    // Fetch all predictions for this squad
                    const allPreds = await (program.account as any).prediction.all();
                    const unsettled = allPreds.filter(
                      (p: any) => p.account.squad.equals(selectedSquad.publicKey) && !p.account.isSettled
                    );
                    
                    if (unsettled.length === 0) {
                      toast('No unsettled predictions found');
                      return;
                    }

                    let settled = 0;
                    for (const pred of unsettled) {
                      try {
                        const allMatches = await (program.account as any).matchResult.all();
                        const matchResult = allMatches.find(
                          (m: any) => m.account.squad.equals(selectedSquad.publicKey) && 
                                     m.account.matchId.toNumber() === pred.account.matchId.toNumber() &&
                                     m.account.isFinal
                        );
                        if (!matchResult) continue;

                        await settlePrediction(matchResult.publicKey, pred.publicKey, pred.account);
                        settled++;
                      } catch (err) {
                        console.error('Settle error for prediction:', err);
                      }
                    }
                    
                    if (settled > 0) {
                      toast.success(`Settled ${settled} prediction(s)`);
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to settle predictions');
                  }
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Settle All Predictions
              </button>
            </div>
            <p className="text-gray-500 text-sm">
              After posting a final match result, click to settle all unsettled predictions and award points.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
