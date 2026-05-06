import { useCallback, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther, toHex } from 'viem';
import { toRequest, type RawTxPayload } from '@/hooks/toRequest';
import { mapTxError } from '@/lib/errors';
import { toast } from '@/hooks/use-toast';
import { useTxHistory } from '@/hooks/useTxHistory';
import type { TxFormValues } from '@/lib/validation';

// Raw passthrough for integer / hex fields: gas, nonce, gasPrice, maxFeePerGas,
// maxPriorityFeePerGas, feeTokenID, feeLimit. Block explorers show these in
// raw wei (or raw count for gas/nonce/feeTokenID), so "input matches display."
// Decimal fractions aren't meaningful and are rejected upstream by zod, but
// we keep the runtime guard as a final safety net.
//   - "0xff"   → "0xff" (verbatim hex)
//   - "100"    → "0x64" (raw integer; never scaled)
//   - "0.001"  → throws
function toRpcQuantity(s: string | undefined, field: string): `0x${string}` | undefined {
  if (s === undefined || s === '') return undefined;
  if (s.startsWith('0x')) return s as `0x${string}`;
  if (s.includes('.')) {
    throw new Error(
      `${field} = "${s}" — decimal fractions can't be raw wei. Use 0x-prefixed hex (e.g. 0x...).`
    );
  }
  return `0x${BigInt(s).toString(16)}` as `0x${string}`;
}

// ETH-denominated quantity (only `value`). Decimal input is interpreted as ETH
// and scaled by parseEther. Hex is raw wei passthrough.
//   - "0xde0b..." → passthrough (raw wei)
//   - "0.01"      → 0x2386f26fc10000 (= 10^16 wei = 0.01 ETH)
//   - "1"         → 0xde0b6b3a7640000 (= 10^18 wei = 1 ETH)
function toRpcEthAmount(s: string | undefined): `0x${string}` | undefined {
  if (s === undefined || s === '') return undefined;
  if (s.startsWith('0x')) return s as `0x${string}`;
  return toHex(parseEther(s));
}

// Encode every quantity field at the wire boundary. `to`, `data`, `type`,
// `feeTokenID`, and `feeLimit` are forwarded as-is from RawTxPayload (custom
// fields go to the wallet untouched; the wallet decides what to do with them).
function encodeForRpc(raw: RawTxPayload): Record<string, unknown> {
  const value = toRpcEthAmount(raw.value);
  const out: Record<string, unknown> = { to: raw.to, value };
  if (raw.data) out.data = raw.data;
  if (raw.type) out.type = raw.type;
  const gas = toRpcQuantity(raw.gas, 'gas');
  if (gas) out.gas = gas;
  const nonce = toRpcQuantity(raw.nonce, 'nonce');
  if (nonce) out.nonce = nonce;
  const gasPrice = toRpcQuantity(raw.gasPrice, 'gasPrice');
  if (gasPrice) out.gasPrice = gasPrice;
  const maxFee = toRpcQuantity(raw.maxFeePerGas, 'maxFeePerGas');
  if (maxFee) out.maxFeePerGas = maxFee;
  const maxPrio = toRpcQuantity(raw.maxPriorityFeePerGas, 'maxPriorityFeePerGas');
  if (maxPrio) out.maxPriorityFeePerGas = maxPrio;
  // Morph altfee custom fields — encode the same way for consistency.
  const ftid = toRpcQuantity(raw.feeTokenID, 'feeTokenID');
  if (ftid) out.feeTokenID = ftid;
  const flim = toRpcQuantity(raw.feeLimit, 'feeLimit');
  if (flim) out.feeLimit = flim;
  return out;
}

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
        const encoded = encodeForRpc(raw);
        const params = { from: address, ...encoded };
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
