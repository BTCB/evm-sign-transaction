import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import { SetupCard } from '@/components/SetupCard';
import { TxHistoryProvider } from '@/hooks/useTxHistory';

const root = createRoot(document.getElementById('root')!);

void (async () => {
  try {
    // Dynamic import lets the module-scope projectId guard throw before App
    // mounts; we render <SetupCard /> instead of crashing the whole tree.
    const { config } = await import('@/config/wagmi');
    const { default: App } = await import('@/App');
    const queryClient = new QueryClient();

    root.render(
      <StrictMode>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <TxHistoryProvider>
                <App />
              </TxHistoryProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </StrictMode>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    root.render(
      <StrictMode>
        <SetupCard message={message} />
      </StrictMode>
    );
  }
})();
