import { z } from 'zod';
import { isAddress, isHex } from 'viem';

// Helper: collapse RHF '' inputs to undefined before validation
const optionalString = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional()
);

// Counts / IDs (gas, nonce, feeTokenID): non-negative integer OR 0x hex.
const HEX_OR_DEC_INT = /^(\d+|0x[0-9a-fA-F]+)$/;
const INT_FORMAT_MSG = 'must be a non-negative integer or 0x-prefixed hex';

const optionalBigintString = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().regex(HEX_OR_DEC_INT, INT_FORMAT_MSG).optional()
);

// Required non-negative integer string (used by Morph altfee `feeTokenID`).
const requiredBigintString = z
  .string()
  .min(1, 'required')
  .regex(HEX_OR_DEC_INT, INT_FORMAT_MSG);

// Fee-pricing quantities (gasPrice, maxFeePerGas, maxPriorityFeePerGas,
// feeLimit): widened to accept DECIMAL (e.g. "1.5") in addition to integer
// and 0x hex. Mirrors the value-field passthrough policy — whatever the user
// types is sent verbatim; the RPC validates.
const HEX_OR_DEC_QUANTITY = /^(\d+(\.\d+)?|0x[0-9a-fA-F]+)$/;
const QUANTITY_FORMAT_MSG = 'use decimal (e.g. 1 or 0.5) or 0x-prefixed hex';

const optionalQuantityString = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().regex(HEX_OR_DEC_QUANTITY, QUANTITY_FORMAT_MSG).optional()
);

// Numeric ETH amount: decimal ETH (parseEther) OR 0x-prefixed hex wei (raw).
// Reject scientific notation; cap decimals at 18 only on the decimal branch.
const ethAmount = z
  .string()
  .min(1, 'required')
  .regex(
    /^(\d+(\.\d+)?|0x[0-9a-fA-F]+)$/,
    'use decimal ETH (e.g. 0.001) or 0x-prefixed hex wei'
  )
  .refine(
    (v) => v.startsWith('0x') || !v.includes('.') || v.split('.')[1].length <= 18,
    'max 18 decimals (wei precision limit)'
  );

const optionalHex = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z
    .string()
    .refine((s) => isHex(s), 'must be 0x-prefixed hex')
    .refine((s) => s.length <= 131072, 'calldata too large (max ~64KB)')
    .optional()
);

const baseFields = {
  to: z.string().refine(isAddress, 'invalid checksum address'),
  value: ethAmount,
  data: optionalHex,
  gas: optionalBigintString,
  nonce: optionalBigintString,
  // Morph altfee fields are exposed on the form regardless of type so users
  // can experiment. They're optional everywhere except the type-127 branch
  // (overridden below) where feeTokenID is required.
  // feeTokenID is an ID (integer-or-hex), feeLimit is a fee quantity (decimals OK).
  feeTokenID: optionalBigintString,
  feeLimit: optionalQuantityString,
};

export { optionalString };

// Schema design (scope addition): the user wants 5 selectable type values:
//   undefined  → wagmi auto-determines (omit `type` from request)
//   0          → legacy   (gasPrice)
//   1          → EIP-2930 (gasPrice, accessList)
//   2          → EIP-1559 (maxFeePerGas + maxPriorityFeePerGas)
//   127        → custom non-standard, treated like type 0 for fee purposes
//
// `z.discriminatedUnion` requires every branch's discriminator to be a literal,
// so the `undefined` branch can't sit inside it. We keep the literal branches
// in a discriminatedUnion (perf-friendlier error messages) and union with the
// `undefined`-typed branch via `z.union`.
// Fee fields (gasPrice, maxFeePerGas, maxPriorityFeePerGas) are raw-wei
// passthrough — integer or 0x hex only. Block explorers show these in raw
// wei, so "input matches display." Decimal fractions (e.g. "0.001") aren't
// meaningful for wei and are rejected at the schema boundary.
const typedBranches = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(0),
    ...baseFields,
    gasPrice: optionalBigintString,
  }),
  z.object({
    type: z.literal(1),
    ...baseFields,
    gasPrice: optionalBigintString,
  }),
  z.object({
    type: z.literal(2),
    ...baseFields,
    maxFeePerGas: optionalBigintString,
    maxPriorityFeePerGas: optionalBigintString,
  }),
  z.object({
    type: z.literal(127),
    ...baseFields,
    // Morph altfee uses 1559-style fee fields (maxFeePerGas + tip) on top of
    // the altfee token plumbing — NOT legacy gasPrice.
    maxFeePerGas: optionalBigintString,
    maxPriorityFeePerGas: optionalBigintString,
    // Override: feeTokenID is REQUIRED for the Morph altfee tx type
    // (baseFields exposes it as optional for all other types).
    feeTokenID: requiredBigintString,
  }),
]);

const noTypeBranch = z.object({
  type: z.undefined(),
  ...baseFields,
});

export const txSchema = z.union([typedBranches, noTypeBranch]);

export type TxFormValues = z.infer<typeof txSchema>;

// SelectedTxType captures every value the dropdown can produce.
export type SelectedTxType = 0 | 1 | 2 | 127 | undefined;

// Form input shape (pre-validation) — every optional field is `string` so RHF
// can manage them via standard inputs without juggling `undefined`. The
// dropdown writes `undefined` when the user picks "None".
export type TxFormInput = {
  type: SelectedTxType;
  to: string;
  value: string;
  data: string;
  gas: string;
  nonce: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  feeTokenID: string;
  feeLimit: string;
};

export const defaultFormValues: TxFormInput = {
  type: 2,
  to: '',
  value: '',
  data: '',
  gas: '',
  nonce: '',
  gasPrice: '',
  maxFeePerGas: '',
  maxPriorityFeePerGas: '',
  feeTokenID: '',
  feeLimit: '',
};

// Translation between the SelectItem string sentinel and the SelectedTxType.
// shadcn's <Select /> requires every item value to be a non-empty string, so
// we use 'none' as the sentinel for `undefined`.
export const TYPE_OPTION_VALUES = ['none', '0', '1', '2', '127'] as const;
export type TypeOptionValue = (typeof TYPE_OPTION_VALUES)[number];

export function typeToOptionValue(t: SelectedTxType): TypeOptionValue {
  if (t === undefined) return 'none';
  return String(t) as TypeOptionValue;
}

export function optionValueToType(v: TypeOptionValue): SelectedTxType {
  if (v === 'none') return undefined;
  return Number(v) as 0 | 1 | 2 | 127;
}
