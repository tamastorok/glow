import '@farcaster/auth-kit/styles.css';
import { AuthKitProvider as FarcasterAuthKitProvider } from '@farcaster/auth-kit';

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: process.env.NEXT_PUBLIC_APP_URL || 'https://www.useglow.xyz',
  siweUri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.useglow.xyz'}/login`,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  relayUrl: 'wss://relay.farcaster.xyz',
};

export function AuthKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <FarcasterAuthKitProvider config={config}>
      {children}
    </FarcasterAuthKitProvider>
  );
} 