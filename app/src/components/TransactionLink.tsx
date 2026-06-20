'use client';

import { FC } from 'react';
import { getExplorerUrl } from '@/lib/utils';

interface TransactionLinkProps {
  signature: string;
  label?: string;
  className?: string;
}

export const TransactionLink: FC<TransactionLinkProps> = ({
  signature,
  label,
  className = '',
}) => {
  return (
    <a
      href={getExplorerUrl(signature)}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-emerald-400 hover:text-emerald-300 text-sm underline underline-offset-2 transition-colors ${className}`}
    >
      {label || `${signature.slice(0, 8)}...${signature.slice(-8)}`}
    </a>
  );
};
