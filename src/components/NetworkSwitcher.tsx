import { useAccount, useSwitchChain } from 'wagmi';
import { chains, isChainConfigured } from '@/config/chains';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export function NetworkSwitcher() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="network-switcher" className="text-xs text-muted-foreground">
        Network
      </Label>
      <Select
        value={chainId ? String(chainId) : undefined}
        onValueChange={(v) => {
          const id = Number(v);
          const target = chains.find((c) => c.id === id);
          if (!target || !isChainConfigured(target)) {
            toast({
              title: 'Chain not configured',
              description: `${target?.name ?? 'This chain'} is missing chainId/RPC values. Edit src/config/chains.ts.`,
              variant: 'destructive',
            });
            return;
          }
          switchChain({ chainId: id });
        }}
        disabled={!isConnected || isPending}
      >
        <SelectTrigger id="network-switcher" className="w-[200px]">
          <SelectValue placeholder={isConnected ? 'Select network' : 'Connect wallet'} />
        </SelectTrigger>
        <SelectContent>
          {chains.map((c) => (
            <SelectItem key={c.name} value={String(c.id)}>
              {c.name}
              {!isChainConfigured(c) && ' (not configured)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
