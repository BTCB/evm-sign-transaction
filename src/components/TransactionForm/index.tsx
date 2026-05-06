import { useEffect } from 'react';
import { FormProvider, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  defaultFormValues,
  txSchema,
  type TxFormInput,
} from '@/lib/validation';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSubmitTransaction } from '@/hooks/useSubmitTransaction';
import { TypeSelector } from '@/components/TransactionForm/TypeSelector';
import { AddressInput } from '@/components/TransactionForm/AddressInput';
import { NumericInput } from '@/components/TransactionForm/NumericInput';
import { HexInput } from '@/components/TransactionForm/HexInput';
import { GasFields } from '@/components/TransactionForm/GasFields';
import { RequestPreview } from '@/components/TransactionForm/RequestPreview';
import { GasEstimateHint } from '@/components/TransactionForm/GasEstimateHint';

export interface TransactionFormProps {
  onSubmitted: (hash: `0x${string}`, chainId: number) => void;
}

export function TransactionForm({ onSubmitted }: TransactionFormProps) {
  // RHF's TFieldValues is the raw form-input shape (TxFormInput). The zod
  // resolver returns the parsed discriminated-union (TxFormValues) — we cast
  // the resolver here to satisfy the TFieldValues generic; we re-parse the
  // values explicitly inside onValidSubmit to recover the typed payload.
  const form = useForm<TxFormInput>({
    resolver: zodResolver(txSchema) as unknown as Resolver<TxFormInput>,
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });
  const { control, handleSubmit, formState, setValue } = form;
  const { isConnected, chainId } = useAccount();
  const { submit, isPending } = useSubmitTransaction();

  const type = useWatch({ control, name: 'type' });

  // Field-clearing on type change for the type-specific fee fields.
  // Altfee (feeTokenID, feeLimit) inputs are ALWAYS rendered and preserved
  // across type changes so users can experiment with sending them on any type.
  // Cases:
  //   undefined  → clear gasPrice + EIP-1559 fields
  //   0/1/127    → clear EIP-1559 fields, keep gasPrice
  //   2          → clear gasPrice, keep EIP-1559 fields
  useEffect(() => {
    const clear = (k: 'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas') =>
      setValue(k, '', { shouldDirty: false, shouldValidate: false });
    if (type === undefined) {
      clear('gasPrice');
      clear('maxFeePerGas');
      clear('maxPriorityFeePerGas');
    } else if (type === 2) {
      clear('gasPrice');
    } else {
      clear('maxFeePerGas');
      clear('maxPriorityFeePerGas');
    }
  }, [type, setValue]);

  // Debounced values for the Request Preview (Step 8.5: 200ms, prop-passed,
  // memo'd component, no watch() inside the preview).
  const liveValues = useWatch({ control });
  const debouncedValues = useDebouncedValue(liveValues, 200);

  const onValidSubmit = async (raw: TxFormInput) => {
    // Re-parse to obtain the strongly-typed discriminated-union payload.
    // formState.isValid + the zodResolver gating guarantees this succeeds.
    const parsed = txSchema.parse(raw);
    const hash = await submit(parsed);
    if (hash && chainId) onSubmitted(hash, chainId);
  };

  const submitDisabled =
    formState.isSubmitting || isPending || !formState.isValid || !isConnected;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Construct transaction</CardTitle>
        <CardDescription>
          All optional fields auto-fill from the wallet/RPC if left blank.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form
            onSubmit={handleSubmit(onValidSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <TypeSelector />
            <AddressInput />
            <NumericInput
              name="value"
              label="Value (raw)"
              hint="passthrough — '0.001' or '0xde0b...' goes to the RPC verbatim"
              placeholder="0xde0b6b3a7640000 or 0.001"
            />
            <HexInput />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <NumericInput name="gas" label="Gas (units)" hint="optional" placeholder="21000" />
                <GasEstimateHint values={(debouncedValues ?? defaultFormValues) as TxFormInput} />
              </div>
              <NumericInput name="nonce" label="Nonce" hint="optional" placeholder="auto" />
            </div>
            <Separator />
            <GasFields type={type} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumericInput
                name="feeTokenID"
                label="Fee token ID"
                hint={type === 127 ? 'required · ≥ 0 (Morph altfee)' : 'altfee · optional, forwarded if filled'}
                placeholder="0"
              />
              <NumericInput
                name="feeLimit"
                label="Fee limit"
                hint="altfee · optional"
                placeholder="0"
              />
            </div>
            <Separator />
            <RequestPreview values={(debouncedValues ?? defaultFormValues) as TxFormInput} />
            <Button type="submit" disabled={submitDisabled} className="w-full">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {!isConnected
                ? 'Connect wallet to submit'
                : isPending
                  ? 'Awaiting wallet…'
                  : 'Sign & broadcast'}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
