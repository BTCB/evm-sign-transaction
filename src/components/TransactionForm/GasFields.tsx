import { NumericInput } from '@/components/TransactionForm/NumericInput';
import type { SelectedTxType } from '@/lib/validation';

// Gas-fee field rendering rules:
//   undefined  → no gas-fee inputs (gas limit + nonce live elsewhere)
//   0          → gasPrice (legacy)
//   1          → gasPrice (eip-2930)
//   2          → maxFeePerGas + maxPriorityFeePerGas (eip-1559)
//   127        → gasPrice (treated as legacy for fee purposes; non-standard)
export function GasFields({ type }: { type: SelectedTxType }) {
  if (type === undefined) {
    return (
      <p className="text-xs text-muted-foreground">
        wagmi will pick the fee strategy automatically based on the chain and your inputs.
      </p>
    );
  }
  if (type === 2) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <NumericInput
          name="maxFeePerGas"
          label="Max fee per gas (raw)"
          hint="passthrough · decimal or 0x hex"
          placeholder="20000000000"
        />
        <NumericInput
          name="maxPriorityFeePerGas"
          label="Max priority fee per gas (raw)"
          hint="passthrough · decimal or 0x hex"
          placeholder="1500000000"
        />
      </div>
    );
  }
  return (
    <NumericInput
      name="gasPrice"
      label="Gas price (raw)"
      hint={
        type === 127
          ? 'passthrough · decimal or 0x hex · Morph altfee (type 127)'
          : 'passthrough · decimal or 0x hex'
      }
      placeholder="0xba43b7400 or 0.1"
    />
  );
}
