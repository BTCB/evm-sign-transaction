import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FieldRow } from '@/components/TransactionForm/FieldRow';
import type { TxFormInput } from '@/lib/validation';

export function AddressInput() {
  const { register, formState } = useFormContext<TxFormInput>();
  const error = formState.errors.to?.message;
  return (
    <FieldRow htmlFor="tx-to" label="To" error={error}>
      <Input
        id="tx-to"
        autoComplete="off"
        spellCheck={false}
        placeholder="0x…"
        {...register('to')}
      />
    </FieldRow>
  );
}
