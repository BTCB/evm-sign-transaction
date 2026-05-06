import { ConnectButton } from '@/components/ConnectButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl">⚡</span>
          <h1 className="text-base font-semibold leading-tight sm:text-lg">EVM Sign Tx</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
          <NetworkSwitcher />
          <div className="flex items-center gap-2">
            <ConnectButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
