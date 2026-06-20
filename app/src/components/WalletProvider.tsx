'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { DEVNET_URL } from '@/lib/constants';

import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

/**
 * Custom fetch with retry + exponential backoff for 429 rate limits.
 */
const fetchWithRetry: typeof fetch = async (input, init) => {
  const MAX_RETRIES = 4;
  let delay = 500; // ms

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(input, init);

    if (res.status === 429 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2; // exponential backoff: 500, 1000, 2000, 4000
      continue;
    }

    return res;
  }

  // Fallback — should not reach here
  return fetch(input, init);
};

export const WalletProviderWrapper: FC<Props> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  const connectionConfig = useMemo(
    () => ({
      commitment: 'confirmed' as const,
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000,
      fetch: fetchWithRetry,
    }),
    []
  );

  return (
    <ConnectionProvider endpoint={DEVNET_URL} config={connectionConfig}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
