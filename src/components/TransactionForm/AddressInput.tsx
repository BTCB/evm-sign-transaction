import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FieldRow } from '@/components/TransactionForm/FieldRow';
import type { TxFormInput } from '@/lib/validation';

const DEFAULT_TO = '0xC0CA2A686667C094929B0E47a8927d8BAF01a4Ed';

export function AddressInput() {
  const { register, setValue, formState } = useFormContext<TxFormInput>();
  const error = formState.errors.to?.message;
  return (
    <FieldRow htmlFor="tx-to" label="To" error={error}>
      <div className="flex gap-2">
        <Input
          id="tx-to"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x…"
          className="flex-1"
          {...register('to')}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setValue('to', DEFAULT_TO, { shouldValidate: true, shouldDirty: true })
          }
        >
          Default
        </Button>
      </div>
    </FieldRow>
  );
}
