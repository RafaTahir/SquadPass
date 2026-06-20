'use client';

import { FC } from 'react';

interface SubscriptionBadgeProps {
  status: 'active' | 'cancelled' | 'paused' | 'none';
  className?: string;
}

export const SubscriptionBadge: FC<SubscriptionBadgeProps> = ({
  status,
  className = '',
}) => {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
    paused: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    none: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  };

  const labels = {
    active: 'Active Subscriber',
    cancelled: 'Cancelled',
    paused: 'Paused',
    none: 'Not Subscribed',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status]} ${className}`}
    >
      {status === 'active' && (
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      )}
      {labels[status]}
    </span>
  );
};
