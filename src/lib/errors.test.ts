import { describe, expect, it } from 'vitest';
import { mapTxError } from '@/lib/errors';

function err(name: string, extra: Partial<{ message: string; shortMessage: string }> = {}) {
  return { name, message: extra.message ?? '', shortMessage: extra.shortMessage };
}

describe('mapTxError', () => {
  it('maps UserRejectedRequestError', () => {
    expect(mapTxError(err('UserRejectedRequestError'))).toBe(
      'You rejected the request in your wallet.'
    );
  });

  it('maps InsufficientFundsError', () => {
    expect(mapTxError(err('InsufficientFundsError'))).toBe(
      'Not enough ETH to cover value + gas.'
    );
  });

  it('maps ChainMismatchError', () => {
    expect(mapTxError(err('ChainMismatchError'))).toBe(
      'Wallet is on a different chain — switch and retry.'
    );
  });

  it('maps InvalidTransactionTypeError (e.g. type 127 rejected)', () => {
    expect(mapTxError(err('InvalidTransactionTypeError'))).toBe(
      'Morph altfee is a non-standard transaction type and the wallet rejected it.'
    );
  });

  it('maps TransactionExecutionError with shortMessage', () => {
    expect(
      mapTxError(err('TransactionExecutionError', { shortMessage: 'reverted: out of gas' }))
    ).toBe('Transaction reverted: reverted: out of gas');
  });

  it('maps EstimateGasExecutionError', () => {
    expect(
      mapTxError(err('EstimateGasExecutionError', { shortMessage: 'cannot estimate' }))
    ).toBe('Gas estimation failed: cannot estimate');
  });

  it('maps HttpRequestError', () => {
    expect(mapTxError(err('HttpRequestError'))).toBe('RPC failure — try a different chain or retry.');
  });

  it('maps RpcRequestError', () => {
    expect(mapTxError(err('RpcRequestError'))).toBe('RPC failure — try a different chain or retry.');
  });

  it('walks cause chain to find a matching wagmi-wrapped viem error', () => {
    const wrapped = {
      name: 'WagmiError',
      message: 'wrapper',
      cause: { name: 'UserRejectedRequestError' },
    };
    expect(mapTxError(wrapped)).toBe('You rejected the request in your wallet.');
  });

  it('falls back for plain Error', () => {
    const e = new Error('boom');
    expect(mapTxError(e)).toContain('Unexpected error');
    expect(mapTxError(e)).toContain('boom');
  });

  it('falls back for non-Error values without throwing', () => {
    expect(mapTxError('what')).toContain('Unexpected error');
    expect(() => mapTxError(undefined)).not.toThrow();
    expect(() => mapTxError(null)).not.toThrow();
    expect(() => mapTxError(42)).not.toThrow();
  });
});
