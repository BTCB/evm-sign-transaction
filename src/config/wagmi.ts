import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Chain } from 'viem';
import { chains, isChainConfigured } from '@/config/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error(
    'Missing VITE_WALLETCONNECT_PROJECT_ID — see README "Setup" section'
  );
}

// Strip out unconfigured chains (e.g. Morph Hoodi placeholder with id=0)
// before handing the list to wagmi/RainbowKit. The NetworkSwitcher still
// surfaces them so the user knows they exist; selecting one shows a toast.
const wagmiChains = chains.filter(isChainConfigured) as unknown as readonly [Chain, ...Chain[]];

export const config = getDefaultConfig({
  appName: 'EVM Sign Tx',
  projectId,
  chains: wagmiChains,
  ssr: false,
});
