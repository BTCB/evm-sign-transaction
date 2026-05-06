import { useFormContext, type FieldError } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FieldRow } from '@/components/TransactionForm/FieldRow';
import type { TxFormInput } from '@/lib/validation';

type NumericFieldName =
  | 'value'
  | 'gas'
  | 'nonce'
  | 'gasPrice'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
  | 'feeTokenID'
  | 'feeLimit';

export function NumericInput({
  name,
  label,
  placeholder,
  hint,
}: {
  name: NumericFieldName;
  label: string;
  placeholder?: string;
  hint?: string;
}) {
  const { register, formState } = useFormContext<TxFormInput>();
  const errors = formState.errors as Record<string, FieldError | undefined>;
  const error = errors[name]?.message;
  return (
    <FieldRow htmlFor={`tx-${name}`} label={label} hint={hint} error={error}>
      <Input
        id={`tx-${name}`}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        {...register(name)}
      />
    </FieldRow>
  );
}
