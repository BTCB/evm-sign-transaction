import { NumericInput } from '@/components/TransactionForm/NumericInput';
import type { SelectedTxType } from '@/lib/validation';

// Gas-fee field rendering rules:
//   undefined  → no gas-fee inputs (gas limit + nonce live elsewhere)
//   0          → gasPrice (legacy)
//   1          → gasPrice (eip-2930)
//   2          → maxFeePerGas + maxPriorityFeePerGas (eip-1559)
//   127        → maxFeePerGas + maxPriorityFeePerGas (Morph altfee uses 1559-style)
export function GasFields({ type }: { type: SelectedTxType }) {
  if (type === undefined) {
    return (
      <p className="text-xs text-muted-foreground">
        wagmi will pick the fee strategy automatically based on the chain and your inputs.
      </p>
    );
  }
  if (type === 2 || type === 127) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <NumericInput
          name="maxFeePerGas"
          label="Max fee per gas (gwei)"
          hint={
            type === 127
              ? 'decimal = gwei (parseGwei) · 0x = raw wei · Morph altfee (type 127)'
              : 'decimal = gwei (parseGwei) · 0x = raw wei'
          }
          placeholder="20 or 0x4a817c800"
        />
        <NumericInput
          name="maxPriorityFeePerGas"
          label="Max priority fee per gas (gwei)"
          hint="decimal = gwei (parseGwei) · 0x = raw wei · must be ≤ maxFeePerGas"
          placeholder="1.5 or 0x59682f00"
        />
      </div>
    );
  }
  return (
    <NumericInput
      name="gasPrice"
      label="Gas price (gwei)"
      hint="decimal = gwei (parseGwei) · 0x = raw wei"
      placeholder="20 or 0xba43b7400"
    />
  );
}
