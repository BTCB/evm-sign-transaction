import { mainnet, sepolia, base, arbitrum, optimism, polygon } from 'viem/chains';
import { defineChain, type Chain } from 'viem';

// Morph Mainnet — chainId 2818, native ETH, official RPC + explorer.
// We define it locally so older `viem/chains` exports don't need to be tracked
// across viem upgrades.
export const morph = defineChain({
  id: 2818,
  name: 'Morph',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-quicknode.morphl2.io'] } },
  blockExplorers: {
    default: { name: 'Morph Explorer', url: 'https://explorer.morphl2.io' },
  },
});

// confirmed by the user. While `id` remains `0` the entry is structurally
// invalid: the network switcher will surface a "Chain not configured" message
// rather than crash, and `buildTxUrl` will return `null` (caller renders
// "Explorer unavailable").
export const morphHoodi = defineChain({
  id: 2910,
  name: 'Morph Hoodi',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-hoodi.morphl2.io'] } },
  blockExplorers: {
    default: { name: 'Morph Hoodi Explorer', url: 'https://explorer-hoodi.morphl2.io' },
  },
  testnet: true,
});

// Order matters for the NetworkSwitcher dropdown — Sepolia first since it's the
// recommended testnet for the demo flow.
export const chains = [
  sepolia,
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  morph,
  morphHoodi,
] as const satisfies readonly [Chain, ...Chain[]];

export type SupportedChainId = (typeof chains)[number]['id'];

// True when a chain entry still has placeholder values (id === 0).
// Components consult this to disable selection / show a warning.
export function isChainConfigured(chain: Chain): boolean {
  return chain.id !== 0;
}
