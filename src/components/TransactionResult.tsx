import { useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildTxUrl } from '@/lib/explorer';
import { useTxHistory } from '@/hooks/useTxHistory';
import { toast } from '@/hooks/use-toast';
import { chains } from '@/config/chains';

function truncate(hash: string) {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export interface TransactionResultProps {
  chainId: number;
  hash: `0x${string}`;
}

// `key={hash}` from the parent ensures a fresh receipt-watcher on every submit.
export function TransactionResult({ chainId, hash }: TransactionResultProps) {
  const { data: receipt, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    chainId,
    hash,
  });
  const { updateStatus } = useTxHistory();

  useEffect(() => {
    if (isSuccess && receipt) {
      updateStatus(hash, receipt.status === 'success' ? 'success' : 'reverted');
    }
  }, [isSuccess, receipt, hash, updateStatus]);

  const url = buildTxUrl(chainId, hash);
  const chainName = chains.find((c) => c.id === chainId)?.name ?? `Chain ${chainId}`;

  const status: 'pending' | 'success' | 'reverted' | 'error' = isSuccess
    ? receipt?.status === 'success'
      ? 'success'
      : 'reverted'
    : isError
      ? 'error'
      : 'pending';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      toast({ title: 'Copied', description: 'Transaction hash copied to clipboard.' });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Clipboard unavailable in this browser.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Latest transaction</CardTitle>
        <StatusBadge status={status} loading={isLoading} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Chain</div>
          <div>{chainName}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Hash</div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="break-all rounded bg-muted px-2 py-1 font-mono text-xs" title={hash}>
              {truncate(hash)}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copy} aria-label="Copy hash">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>
        <div>
          {url ? (
            <Button asChild variant="link" className="h-auto p-0">
              <a href={url} target="_blank" rel="noreferrer">
                View on explorer <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Explorer unavailable</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
  loading,
}: {
  status: 'pending' | 'success' | 'reverted' | 'error';
  loading: boolean;
}) {
  if (status === 'success') return <Badge variant="success">confirmed</Badge>;
  if (status === 'reverted') return <Badge variant="destructive">reverted</Badge>;
  if (status === 'error') return <Badge variant="destructive">error</Badge>;
  return <Badge variant="warning">{loading ? 'pending…' : 'pending'}</Badge>;
}
