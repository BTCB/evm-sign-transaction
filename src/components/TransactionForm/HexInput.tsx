import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FieldRow } from '@/components/TransactionForm/FieldRow';
import type { TxFormInput } from '@/lib/validation';

export function HexInput() {
  const { register, formState } = useFormContext<TxFormInput>();
  const error = formState.errors.data?.message;
  return (
    <FieldRow
      htmlFor="tx-data"
      label="Data (calldata)"
      hint="optional, 0x-prefixed hex"
      error={error}
    >
      <Input
        id="tx-data"
        autoComplete="off"
        spellCheck={false}
        placeholder="0x"
        {...register('data')}
      />
    </FieldRow>
  );
}
