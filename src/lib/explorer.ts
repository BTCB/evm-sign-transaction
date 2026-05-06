import { chains } from '@/config/chains';

export function buildTxUrl(chainId: number, hash: `0x${string}`): string | null {
  const chain = chains.find((c) => c.id === chainId);
  const url = chain?.blockExplorers?.default?.url;
  return url ? `${url}/tx/${hash}` : null;
}
