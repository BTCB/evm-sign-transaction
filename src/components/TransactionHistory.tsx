import { Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTxHistory, type TxStatus } from '@/hooks/useTxHistory';
import { buildTxUrl } from '@/lib/explorer';
import { chains } from '@/config/chains';
import { toast } from '@/hooks/use-toast';

function statusVariant(status: TxStatus): BadgeProps['variant'] {
  if (status === 'success') return 'success';
  if (status === 'reverted') return 'destructive';
  return 'warning';
}

function truncate(hash: string) {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function relTime(ts: number): string {
  const secs = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export function TransactionHistory() {
  const { entries } = useTxHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session history</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Submitted transactions appear here. The list clears on refresh or wallet change.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => {
              const chainName = chains.find((c) => c.id === e.chainId)?.name ?? `Chain ${e.chainId}`;
              const url = buildTxUrl(e.chainId, e.hash);
              return (
                <li
                  key={e.hash}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{chainName}</Badge>
                    <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                    <code
                      className="break-all rounded bg-muted px-2 py-0.5 font-mono text-xs"
                      title={e.hash}
                    >
                      {truncate(e.hash)}
                    </code>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{relTime(e.timestamp)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(e.hash);
                          toast({ title: 'Copied', description: 'Hash copied.' });
                        } catch {
                          toast({
                            title: 'Copy failed',
                            description: 'Clipboard unavailable.',
                            variant: 'destructive',
                          });
                        }
                      }}
                      aria-label="Copy hash"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {url && (
                      <a className="underline" href={url} target="_blank" rel="noreferrer">
                        explorer
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
