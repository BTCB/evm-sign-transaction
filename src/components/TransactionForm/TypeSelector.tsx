import { useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldRow } from '@/components/TransactionForm/FieldRow';
import {
  optionValueToType,
  typeToOptionValue,
  type TxFormInput,
  type TypeOptionValue,
} from '@/lib/validation';

const OPTIONS: { value: TypeOptionValue; label: string; sublabel: string }[] = [
  { value: 'none', label: 'None', sublabel: 'auto — let wagmi decide' },
  { value: '0', label: 'Type 0', sublabel: 'Legacy' },
  { value: '1', label: 'Type 1', sublabel: 'EIP-2930' },
  { value: '2', label: 'Type 2', sublabel: 'EIP-1559' },
  { value: '127', label: 'Type 127', sublabel: 'Morph altfee' },
];

export function TypeSelector() {
  const { setValue, watch, formState } = useFormContext<TxFormInput>();
  const type = watch('type');
  const error = formState.errors.type?.message;

  return (
    <FieldRow htmlFor="tx-type" label="Transaction type" error={error}>
      <Select
        value={typeToOptionValue(type)}
        onValueChange={(v) =>
          setValue('type', optionValueToType(v as TypeOptionValue), {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger id="tx-type">
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label} — {o.sublabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
