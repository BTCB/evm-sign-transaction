import { describe, expect, it } from 'vitest';
import { buildTxUrl } from '@/lib/explorer';

const HASH = '0xabc1234567890abc1234567890abc1234567890abc1234567890abc12345678' as const;

describe('buildTxUrl', () => {
  it.each([
    [1, 'https://etherscan.io'],
    [11155111, 'https://sepolia.etherscan.io'],
    [8453, 'https://basescan.org'],
    [42161, 'https://arbiscan.io'],
    [10, 'https://optimistic.etherscan.io'],
    [137, 'https://polygonscan.com'],
    [2818, 'https://explorer.morphl2.io'],
  ])('returns %s explorer URL for chainId %i', (chainId, base) => {
    const url = buildTxUrl(chainId, HASH);
    expect(url).toBe(`${base}/tx/${HASH}`);
  });

  it('returns the placeholder Morph Hoodi explorer URL when chainId is 0', () => {
    // Morph Hoodi is currently unconfigured (id=0). buildTxUrl uses the chain
    // entry's blockExplorers.default.url, which is the placeholder. The
    // NetworkSwitcher prevents the user reaching this state in practice.
    const url = buildTxUrl(0, HASH);
    expect(url).toBe(`https://explorer-hoodi.morphl2.io/tx/${HASH}`);
  });

  it('returns null for an unsupported chainId', () => {
    expect(buildTxUrl(99999, HASH)).toBeNull();
  });
});
