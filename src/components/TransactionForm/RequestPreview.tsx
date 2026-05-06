import { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { txSchema, type TxFormInput } from '@/lib/validation';
import { toRequest } from '@/hooks/toRequest';

// All payload values are plain strings now (verbatim user input), so a
// straight JSON.stringify is sufficient.
function serialize(req: unknown): string {
  return JSON.stringify(req, null, 2);
}

export interface RequestPreviewProps {
  values: TxFormInput;
}

// ADR Step 8.5: memo'd, receives debounced values via prop. We use safeParse
// so partially-filled forms render `null` instead of throwing.
export const RequestPreview = memo(function RequestPreview({ values }: RequestPreviewProps) {
  const [open, setOpen] = useState(false);
  const result = txSchema.safeParse(values);
  const body = result.success ? serialize(toRequest(result.data)) : 'null';

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Preview request payload</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" type="button" aria-expanded={open}>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
            <span className="sr-only">Toggle request preview</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <pre className="mt-3 max-h-72 overflow-auto rounded bg-background p-3 font-mono text-xs leading-relaxed">
          {body}
        </pre>
        {!result.success && (
          <p className="mt-2 text-xs text-muted-foreground">
            Fill required fields with valid values to see the converted request.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});
