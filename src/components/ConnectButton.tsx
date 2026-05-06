import { ConnectButton as RKConnectButton } from '@rainbow-me/rainbowkit';

// Thin wrapper so we can swap styling without exposing RainbowKit everywhere.
export function ConnectButton() {
  return <RKConnectButton showBalance={false} chainStatus="none" accountStatus="address" />;
}
