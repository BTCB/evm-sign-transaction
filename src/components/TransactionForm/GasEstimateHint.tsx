import { useEstimateGas, useAccount } from 'wagmi';
import { isAddress, isHex, parseEther } from 'viem';
import type { TxFormInput } from '@/lib/validation';

// ADR executor-time hint Step 5b: NO debounce — react-query's stale-time
// already dedups; an extra debounce only causes input lag.
export function GasEstimateHint({ values }: { values: TxFormInput }) {
  const { address, chainId, isConnected } = useAccount();

  const enabled =
    isConnected &&
    !!chainId &&
    !!address &&
    isAddress(values.to) &&
    /^\d+(\.\d+)?$/.test(values.value) &&
    (!values.data || isHex(values.data));

  let parsedValue: bigint | undefined;
  try {
    parsedValue = enabled && values.value ? parseEther(values.value) : undefined;
  } catch {
    parsedValue = undefined;
  }

  const { data, isFetching, isError } = useEstimateGas({
    to: enabled ? (values.to as `0x${string}`) : undefined,
    value: parsedValue,
    data: enabled && values.data ? (values.data as `0x${string}`) : undefined,
    account: enabled ? address : undefined,
    chainId,
    query: { enabled },
  });

  if (!enabled) return null;
  if (isFetching) return <span className="text-xs text-muted-foreground">estimating…</span>;
  if (isError) return <span className="text-xs text-muted-foreground">estimate unavailable</span>;
  if (data === undefined) return null;
  return <span className="text-xs text-muted-foreground">estimated: {data.toString()}</span>;
}
