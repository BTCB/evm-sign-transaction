# EVM Sign &amp; Send Transaction

A single-page React app for **constructing, signing, and broadcasting** EVM
transactions across Sepolia, Ethereum, Base, Arbitrum One, Optimism, and
Polygon. Exposes all three transaction types (0 legacy / 1 EIP-2930 / 2
EIP-1559) with dynamic gas-fee fields, an in-session history list, dark-mode
toggle, and a live "Request Preview" panel that shows the post-conversion
wagmi request as JSON.

## Stack

- Vite + React 18 + TypeScript (strict)
- wagmi v2 + viem + @tanstack/react-query
- RainbowKit (WalletConnect-backed multi-wallet modal)
- Tailwind CSS + shadcn/ui primitives + lucide icons
- react-hook-form + zod (`zodResolver`, discriminated union per tx type)
- Vitest + Testing Library

## Prerequisites

- Node.js 20+
- A WalletConnect Cloud project ID
  ([cloud.walletconnect.com](https://cloud.walletconnect.com))

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set VITE_WALLETCONNECT_PROJECT_ID=<your-id>
npm run dev
```

If `VITE_WALLETCONNECT_PROJECT_ID` is missing, the app renders a `<SetupCard>`
with the steps above instead of failing silently.

## Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the Vite dev server                 |
| `npm run build`   | Type-check + production build into `dist` |
| `npm run preview` | Preview the production build              |
| `npm test`        | Run the Vitest suite once                 |
| `npm run lint`    | Run ESLint                                |

## Supported chains

Sepolia, Ethereum mainnet, Base, Arbitrum One, Optimism, Polygon, **Morph
Mainnet**, **Morph Hoodi (placeholder)** — defined in `src/config/chains.ts`.
Six come straight from `viem/chains`; Morph Mainnet is defined locally with
its known production values (chainId 2818, RPC `https://rpc-quicknode.morphl2.io`,
explorer `https://explorer.morphl2.io`). The block explorer URL for each comes
from `chain.blockExplorers.default.url`; there is no hand-rolled explorer map.

> **Morph Hoodi requires user input.** The chainId, RPC URL, and explorer URL
> in `src/config/chains.ts` for `morphHoodi` are placeholders (`id: 0`,
> `https://TODO-...`). Replace them with the real values before using that
> network. The NetworkSwitcher renders Morph Hoodi as `(not configured)` and
> a destructive toast prevents selection until the placeholders are filled in.

## Transaction type selector

Five options are exposed:

| Value       | Label                          | Fee fields rendered                       |
| ----------- | ------------------------------ | ----------------------------------------- |
| `undefined` | `None — auto`                  | none (wagmi/viem auto-pick)               |
| `0`         | `Type 0 — Legacy`              | `gasPrice`                                |
| `1`         | `Type 1 — EIP-2930`            | `gasPrice`                                |
| `2`         | `Type 2 — EIP-1559`            | `maxFeePerGas` + `maxPriorityFeePerGas`   |
| `127`       | `Type 127 — Custom`            | `gasPrice` (treated as legacy for fees)   |

When `None` is selected, `toRequest` omits the `type` key entirely. When 127
is selected, the literal numeric `127` is forwarded; viem may reject this at
submit time as an `InvalidTransactionTypeError` — `mapTxError` surfaces a
clear message in that case.

The shadcn `<Select />` requires non-empty string values, so the selector
internally uses the sentinel string `"none"` for `undefined`; translation is
handled by `typeToOptionValue` / `optionValueToType` in `src/lib/validation.ts`.

## Manual happy-path on Sepolia

1. Open the app, click **Connect** → pick MetaMask (or any RainbowKit wallet).
2. Use the network dropdown to switch to **Sepolia** — the wallet prompts you
   to switch.
3. Fill the form: `type=2`, `to=<your address>`, `value=0.001`, leave
   gas/nonce blank.
4. Optionally expand **Preview request payload** to see the converted
   wagmi request (BigInts shown with `n` suffix).
5. Click **Sign &amp; broadcast** → approve in the wallet → the transaction hash,
   copy button, explorer link, and a live status badge appear in the right
   column. The history list shows the entry. Status flips
   `pending → confirmed` within a block (~15s on Sepolia).

## Troubleshooting

- **White screen / "Setup required"** — `VITE_WALLETCONNECT_PROJECT_ID` is not
  set. Get a free ID at cloud.walletconnect.com and put it in `.env.local`.
- **"WalletConnect Core is already initialized"** in dev — benign HMR re-import
  warning. The `wagmi.ts` config is a module-scope singleton; Vite caches the
  module identity, so the actual call only runs once.
- **History list emptied unexpectedly** — by design. We clear it on wallet
  disconnect or address change so a hash is never shown under the wrong
  account. There is no localStorage persistence.
- **Wallet says "wrong network"** — the network switcher writes immediately
  via `useSwitchChain`. Approve the wallet prompt; the form always reads chain
  from `useAccount().chainId`.

## Out of scope (v1)

- ENS resolution for the `to` field
- USD-equivalent display
- Persistence of history beyond the page session
