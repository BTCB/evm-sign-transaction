import { useFormContext, type FieldError } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

// Pull the leftmost concrete value out of a placeholder like
// "9088635 or 0x4a817c800" → "9088635". Skips placeholders that are pure
// hints (e.g. "auto") rather than real candidate values.
function pickDefault(placeholder: string | undefined): string | undefined {
  if (!placeholder) return undefined;
  if (placeholder === 'auto') return undefined;
  return placeholder.split(' or ')[0].trim();
}

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
  const { register, setValue, formState } = useFormContext<TxFormInput>();
  const errors = formState.errors as Record<string, FieldError | undefined>;
  const error = errors[name]?.message;
  const fillValue = pickDefault(placeholder);
  return (
    <FieldRow htmlFor={`tx-${name}`} label={label} hint={hint} error={error}>
      <div className="flex gap-2">
        <Input
          id={`tx-${name}`}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className="flex-1"
          {...register(name)}
        />
        {fillValue !== undefined && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setValue(name, fillValue, { shouldValidate: true, shouldDirty: true })
            }
          >
            Default
          </Button>
        )}
      </div>
    </FieldRow>
  );
}
