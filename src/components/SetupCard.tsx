import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SetupCard({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Setup required</CardTitle>
          <CardDescription>
            This app needs a WalletConnect Cloud project ID to initialise the wallet modal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Visit{' '}
              <a
                className="underline"
                href="https://cloud.walletconnect.com"
                target="_blank"
                rel="noreferrer"
              >
                cloud.walletconnect.com
              </a>{' '}
              and create a project.
            </li>
            <li>
              Copy <code className="rounded bg-muted px-1">.env.example</code> to{' '}
              <code className="rounded bg-muted px-1">.env.local</code>.
            </li>
            <li>
              Set <code className="rounded bg-muted px-1">VITE_WALLETCONNECT_PROJECT_ID</code> to the
              project ID.
            </li>
            <li>
              Restart <code className="rounded bg-muted px-1">npm run dev</code>.
            </li>
          </ol>
          {message && (
            <pre className="whitespace-pre-wrap rounded bg-muted p-3 text-xs">{message}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
