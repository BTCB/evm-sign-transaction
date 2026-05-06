// Maps wagmi/viem errors to human-readable strings.
//
// Implementation note (per ADR executor-time hint Step 7b): we prefer
// `err.name === 'XError'` over `instanceof XError`. wagmi v2 may bundle
// different viem minor versions over time; `instanceof` silently misses when
// two viem copies coexist; `err.name` is stable across versions.

type ErrorWithName = { name?: string; message?: string; shortMessage?: string };

function asErr(e: unknown): ErrorWithName {
  if (e && typeof e === 'object') return e as ErrorWithName;
  return { message: typeof e === 'string' ? e : undefined };
}

export function mapTxError(err: unknown): string {
  const e = asErr(err);
  const name = e.name ?? '';
  const short = e.shortMessage ?? e.message ?? '';

  // Walk the cause chain in case wagmi has wrapped a viem error.
  const chain: ErrorWithName[] = [e];
  let cur: unknown = err;
  for (let i = 0; i < 8 && cur && typeof cur === 'object' && 'cause' in cur; i++) {
    const next = (cur as { cause?: unknown }).cause;
    if (!next || typeof next !== 'object') break;
    chain.push(next as ErrorWithName);
    cur = next;
  }

  const hasName = (n: string) => chain.some((c) => c.name === n);

  if (hasName('UserRejectedRequestError')) {
    return 'You rejected the request in your wallet.';
  }
  if (hasName('InsufficientFundsError')) {
    return 'Not enough ETH to cover value + gas.';
  }
  if (hasName('ChainMismatchError')) {
    return 'Wallet is on a different chain — switch and retry.';
  }
  if (
    hasName('InvalidTransactionTypeError') ||
    hasName('InvalidSerializableTransactionError')
  ) {
    return 'Morph altfee is a non-standard transaction type and the wallet rejected it.';
  }
  if (hasName('TransactionExecutionError')) {
    const m = chain.find((c) => c.name === 'TransactionExecutionError');
    return `Transaction reverted: ${m?.shortMessage ?? m?.message ?? 'execution failed'}`;
  }
  if (hasName('EstimateGasExecutionError')) {
    const m = chain.find((c) => c.name === 'EstimateGasExecutionError');
    return `Gas estimation failed: ${m?.shortMessage ?? m?.message ?? 'unable to estimate'}`;
  }
  if (hasName('HttpRequestError') || hasName('RpcRequestError')) {
    return 'RPC failure — try a different chain or retry.';
  }

  // Use top-level shortMessage / message if present so the user sees something
  // actionable instead of the literal "[object Object]".
  if (name && short) return `Unexpected error: ${short}`;
  if (short) return `Unexpected error: ${short}`;
  return `Unexpected error: ${name || 'unknown'}`;
}
