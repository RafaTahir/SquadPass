'use client';

import { FC, useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';
import { useSquadPass } from '@/hooks/useSquadPass';
import { formatTokenAmount, formatDate, truncateAddress } from '@/lib/utils';
import idl from '@/lib/idl/squadpass.json';

interface BillingPanelProps {
  squadPda: PublicKey;
  squad: any;
}

interface SubInfo {
  pda: PublicKey;
  data: any;
  isDue: boolean;
}

export const BillingPanel: FC<BillingPanelProps> = ({ squadPda, squad }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { executeBilling } = useSquadPass();
  const [subs, setSubs] = useState<SubInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingIdx, setBillingIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!wallet) return;
      try {
        setLoading(true);
        const provider = new AnchorProvider(connection, wallet, {
          commitment: 'confirmed',
        });
        const program = new Program(idl as any, provider);

        const accounts = await (program.account as any).subscription.all([
          {
            memcmp: {
              offset: 8 + 32, // After discriminator + subscriber
              bytes: squadPda.toBase58(),
            },
          },
        ]);

        const now = Math.floor(Date.now() / 1000);
        const subInfos: SubInfo[] = accounts.map((a: any) => ({
          pda: a.publicKey,
          data: a.account,
          isDue:
            (a.account as any).status?.active !== undefined &&
            now >= ((a.account as any).nextDueAt?.toNumber?.() || 0),
        }));

        setSubs(subInfos);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubs();
  }, [connection, wallet, squadPda]);

  const handleBill = async (sub: SubInfo, index: number) => {
    try {
      setBillingIdx(index);
      await executeBilling(squadPda, squad, sub.pda, sub.data);
      toast.success('Billing executed successfully');
      // Refresh
      sub.isDue = false;
      setSubs([...subs]);
    } catch (err: any) {
      toast.error(err.message || 'Billing failed');
    } finally {
      setBillingIdx(null);
    }
  };

  const handleBillAll = async () => {
    const dueSubs = subs.filter((s) => s.isDue);
    if (dueSubs.length === 0) {
      toast('No payments due');
      return;
    }

    for (let i = 0; i < dueSubs.length; i++) {
      const idx = subs.indexOf(dueSubs[i]);
      try {
        await handleBill(dueSubs[i], idx);
      } catch {
        // Continue with others
      }
    }
  };

  const dueCount = subs.filter((s) => s.isDue).length;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Billing Panel</h3>
        {dueCount > 0 && (
          <button
            onClick={handleBillAll}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Run Matchday Billing ({dueCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700 rounded-lg" />
          ))}
        </div>
      ) : subs.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          No subscribers yet
        </p>
      ) : (
        <div className="space-y-2">
          {subs.map((sub, idx) => {
            const nextDue = sub.data.nextDueAt?.toNumber?.() || 0;
            const isActive = sub.data.status?.active !== undefined;

            return (
              <div
                key={sub.pda.toBase58()}
                className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3"
              >
                <div>
                  <p className="text-white text-sm font-mono">
                    {truncateAddress(sub.data.subscriber.toBase58())}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {isActive ? (
                      sub.isDue ? (
                        <span className="text-amber-400">Payment due</span>
                      ) : (
                        <>Next: {formatDate(nextDue)}</>
                      )
                    ) : (
                      <span className="text-red-400">Cancelled</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">
                    {formatTokenAmount(
                      sub.data.totalPaid?.toNumber?.() || 0
                    )}{' '}
                    paid
                  </span>
                  {sub.isDue && (
                    <button
                      onClick={() => handleBill(sub, idx)}
                      disabled={billingIdx === idx}
                      className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {billingIdx === idx ? 'Billing...' : 'Bill'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
