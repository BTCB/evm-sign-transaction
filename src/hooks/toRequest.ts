import type { TxFormValues } from '@/lib/validation';

// Raw eth_sendTransaction payload — strict passthrough of user input.
// Quantity fields (value, gas, gasPrice, ...) carry the user's exact string,
// whether decimal or 0x-prefixed hex. No BigInt conversion. No parseEther
// (decimal '0.001' stays '0.001', hex '0xde0b...' stays '0xde0b...').
//
// Rationale: this app exposes the EVM tx surface for testing/learning. The
// user takes responsibility for entering RPC-valid quantities; the wallet/RPC
// will surface any rejection.
export type RawTxPayload = {
  to: `0x${string}`;
  value: string;
  data?: `0x${string}`;
  type?: '0x0' | '0x1' | '0x2' | '0x7f';
  gas?: string;
  nonce?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  // Morph altfee custom fields, forwarded verbatim when filled.
  feeTokenID?: string;
  feeLimit?: string;
};

// Numeric tx-type → JSON-RPC hex quantity. The dropdown stores numbers, not
// user-typed strings, so this conversion is canonical (not "user input").
const TYPE_HEX: Record<0 | 1 | 2 | 127, '0x0' | '0x1' | '0x2' | '0x7f'> = {
  0: '0x0',
  1: '0x1',
  2: '0x2',
  127: '0x7f',
};

export function toRequest(values: TxFormValues): RawTxPayload {
  const out: RawTxPayload = {
    to: values.to as `0x${string}`,
    value: values.value,
  };

  const setIfPresent = <K extends keyof RawTxPayload>(k: K, v: string | undefined) => {
    if (v !== undefined && v !== '') out[k] = v as RawTxPayload[K];
  };

  setIfPresent('data', values.data);
  setIfPresent('gas', values.gas);
  setIfPresent('nonce', values.nonce);
  setIfPresent('feeTokenID', values.feeTokenID);
  setIfPresent('feeLimit', values.feeLimit);

  if (values.type === undefined) return out;
  out.type = TYPE_HEX[values.type];

  if (values.type === 2) {
    setIfPresent('maxFeePerGas', values.maxFeePerGas);
    setIfPresent('maxPriorityFeePerGas', values.maxPriorityFeePerGas);
  } else {
    setIfPresent('gasPrice', values.gasPrice);
  }

  return out;
}
