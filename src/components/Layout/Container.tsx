import type { ReactNode } from 'react';

export function Container({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2">{children}</div>
    </main>
  );
}
