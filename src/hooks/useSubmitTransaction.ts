import { useCallback, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { toRequest } from '@/hooks/toRequest';
import { mapTxError } from '@/lib/errors';
import { toast } from '@/hooks/use-toast';
import { useTxHistory } from '@/hooks/useTxHistory';
import type { TxFormValues } from '@/lib/validation';

// Raw RPC send: bypasses wagmi's typed `useSendTransaction` so we can pass the
// user's literal input (decimal or hex strings) straight into eth_sendTransaction.
// The wallet/RPC enforces validity — if the user enters a non-RPC-valid value,
// the wallet rejects and we surface the error via mapTxError.
export function useSubmitTransaction() {
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const { add } = useTxHistory();

  const submit = useCallback(
    async (values: TxFormValues) => {
      if (!isConnected || !chainId || !address || !walletClient) {
        toast({
          title: 'Wallet not connected',
          description: 'Connect a wallet to submit transactions.',
          variant: 'destructive',
        });
        return null;
      }
      if (isPending) return null;
      setIsPending(true);
      try {
        const raw = toRequest(values);
        const params = { from: address, ...raw };
        // Bypass viem's strict RpcTransactionRequest typing — the user is
        // responsible for entering valid hex quantities. The cast lets us
        // forward decimal/hex strings verbatim.
        const req = walletClient.request as unknown as (args: {
          method: 'eth_sendTransaction';
          params: [Record<string, unknown>];
        }) => Promise<`0x${string}`>;
        const hash = await req({ method: 'eth_sendTransaction', params: [params] });
        add({ chainId, hash, status: 'pending', timestamp: Date.now() });
        return hash;
      } catch (err) {
        const message = mapTxError(err);
        toast({
          title: 'Transaction failed',
          description: message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [isConnected, chainId, address, walletClient, isPending, add]
  );

  const reset = useCallback(() => setIsPending(false), []);

  return { submit, isPending, reset };
}
