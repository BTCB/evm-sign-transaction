import { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Container } from '@/components/Layout/Container';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionResult } from '@/components/TransactionResult';
import { TransactionHistory } from '@/components/TransactionHistory';
import { Toaster } from '@/components/ui/toaster';

type Latest = { hash: `0x${string}`; chainId: number };

function App() {
  const [latest, setLatest] = useState<Latest | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <Container>
        <div className="flex flex-col gap-6">
          <TransactionForm
            onSubmitted={(hash, chainId) => setLatest({ hash, chainId })}
          />
        </div>
        <div className="flex flex-col gap-6">
          {latest ? (
            <TransactionResult key={latest.hash} chainId={latest.chainId} hash={latest.hash} />
          ) : (
            <EmptyResultPlaceholder />
          )}
          <TransactionHistory />
        </div>
      </Container>
      <Toaster />
    </div>
  );
}

function EmptyResultPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      Submit a transaction to see its hash, status, and explorer link here.
    </div>
  );
}

export default App;
