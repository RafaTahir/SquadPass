'use client';

import { FC } from 'react';
import Link from 'next/link';
import { COUNTRY_FLAGS } from '@/lib/constants';
import { formatTokenAmount, formatCadence } from '@/lib/utils';

interface SquadCardProps {
  publicKey: string;
  country: string;
  name: string;
  memberCount: number;
  subscriptionAmount: number;
  cadenceSeconds: number;
  isActive: boolean;
}

export const SquadCard: FC<SquadCardProps> = ({
  publicKey,
  country,
  name,
  memberCount,
  subscriptionAmount,
  cadenceSeconds,
  isActive,
}) => {
  const flag = COUNTRY_FLAGS[country] || '\u26BD';

  return (
    <Link href={`/squad/${publicKey}`}>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{flag}</span>
          {isActive ? (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              Active
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full">
              Closed
            </span>
          )}
        </div>

        <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-emerald-400 transition-colors">
          {name}
        </h3>
        <p className="text-gray-500 text-sm mb-4">{country}</p>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700/50">
          <div>
            <p className="text-gray-500 text-xs">Members</p>
            <p className="text-white font-semibold text-sm">{memberCount}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Price</p>
            <p className="text-white font-semibold text-sm">
              {formatTokenAmount(subscriptionAmount)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Cadence</p>
            <p className="text-white font-semibold text-sm">
              /{formatCadence(cadenceSeconds)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
