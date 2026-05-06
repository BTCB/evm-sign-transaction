// Tests for the form-values → raw eth_sendTransaction payload converter.
// Since the hook now passes the user's literal input through to the wallet
// (no parseEther, no BigInt coercion), these tests assert STRING passthrough
// rather than bigint coercion.
import { describe, expect, it } from 'vitest';
import { toRequest } from '@/hooks/toRequest';
import { txSchema } from '@/lib/validation';

const TO = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

function parse(input: Record<string, unknown>) {
  return txSchema.parse(input);
}

describe('toRequest', () => {
  it('produces type 2 (eip-1559) with maxFeePerGas / maxPriorityFeePerGas as strings', () => {
    const v = parse({
      type: 2,
      to: TO,
      value: '0.001',
      data: '',
      gas: '21000',
      nonce: '5',
      maxFeePerGas: '20000000000',
      maxPriorityFeePerGas: '1500000000',
    });
    const r = toRequest(v);
    expect(r.type).toBe('0x2');
    expect(r.to).toBe(TO);
    expect(r.value).toBe('0.001'); // verbatim — no parseEther
    expect(r.gas).toBe('21000');
    expect(r.nonce).toBe('5');
    expect(r.maxFeePerGas).toBe('20000000000');
    expect(r.maxPriorityFeePerGas).toBe('1500000000');
    expect(r.gasPrice).toBeUndefined();
  });

  it('produces type 0 (legacy) with gasPrice as string', () => {
    const v = parse({
      type: 0,
      to: TO,
      value: '1',
      data: '',
      gas: '',
      nonce: '',
      gasPrice: '50000000000',
    });
    const r = toRequest(v);
    expect(r.type).toBe('0x0');
    expect(r.value).toBe('1');
    expect(r.gasPrice).toBe('50000000000');
    expect(r.gas).toBeUndefined();
    expect(r.nonce).toBeUndefined();
    expect(r.maxFeePerGas).toBeUndefined();
  });

  it('produces type 1 (eip-2930) with gasPrice as string + data', () => {
    const v = parse({
      type: 1,
      to: TO,
      value: '0',
      data: '0xdeadbeef',
      gas: '',
      nonce: '',
      gasPrice: '1000000000',
    });
    const r = toRequest(v);
    expect(r.type).toBe('0x1');
    expect(r.gasPrice).toBe('1000000000');
    expect(r.data).toBe('0xdeadbeef');
  });

  it('omits empty optional fields entirely (no undefined keys in payload)', () => {
    const v = parse({
      type: 2,
      to: TO,
      value: '0.5',
      data: '',
      gas: '',
      nonce: '',
      maxFeePerGas: '',
      maxPriorityFeePerGas: '',
    });
    const r = toRequest(v);
    expect('gas' in r).toBe(false);
    expect('nonce' in r).toBe(false);
    expect('data' in r).toBe(false);
    expect('maxFeePerGas' in r).toBe(false);
    expect('maxPriorityFeePerGas' in r).toBe(false);
  });

  it('value passthrough: decimal stays decimal (NOT multiplied by 10^18)', () => {
    const v = parse({
      type: 2,
      to: TO,
      value: '0.001',
      data: '',
      gas: '',
      nonce: '',
      maxFeePerGas: '',
      maxPriorityFeePerGas: '',
    });
    expect(toRequest(v).value).toBe('0.001');
  });

  it('value passthrough: 0x-prefixed hex stays hex (NOT BigInt-coerced)', () => {
    const v = parse({
      type: 2,
      to: TO,
      value: '0xde0b6b3a7640000',
      data: '',
      gas: '',
      nonce: '',
      maxFeePerGas: '',
      maxPriorityFeePerGas: '',
    });
    expect(toRequest(v).value).toBe('0xde0b6b3a7640000');
  });

  it('gasPrice passthrough: decimal stays decimal (NOT multiplied by 10^18)', () => {
    const v = parse({
      type: 0,
      to: TO,
      value: '0',
      data: '',
      gas: '',
      nonce: '',
      gasPrice: '1.5',
    });
    expect(toRequest(v).gasPrice).toBe('1.5');
  });

  it('maxFeePerGas / maxPriorityFeePerGas passthrough: decimal stays decimal', () => {
    const v = parse({
      type: 2,
      to: TO,
      value: '0',
      data: '',
      gas: '',
      nonce: '',
      maxFeePerGas: '20.5',
      maxPriorityFeePerGas: '0.001',
    });
    const r = toRequest(v);
    expect(r.maxFeePerGas).toBe('20.5');
    expect(r.maxPriorityFeePerGas).toBe('0.001');
  });

  it('gas / nonce remain integer-or-hex (no decimal)', () => {
    expect(() =>
      parse({
        type: 0,
        to: TO,
        value: '0',
        data: '',
        gas: '21.5',
        nonce: '',
        gasPrice: '',
      })
    ).toThrow();
    expect(() =>
      parse({
        type: 0,
        to: TO,
        value: '0',
        data: '',
        gas: '',
        nonce: '0.5',
        gasPrice: '',
      })
    ).toThrow();
  });

  it('gasPrice / gas / nonce passthrough: hex stays hex', () => {
    const v = parse({
      type: 0,
      to: TO,
      value: '0',
      data: '',
      gas: '0x5208',
      nonce: '0x10',
      gasPrice: '0xba43b7400',
    });
    const r = toRequest(v);
    expect(r.gas).toBe('0x5208');
    expect(r.nonce).toBe('0x10');
    expect(r.gasPrice).toBe('0xba43b7400');
  });

  it('rejects scientific notation at the zod boundary', () => {
    expect(() =>
      parse({
        type: 2,
        to: TO,
        value: '1e-3',
        data: '',
        gas: '',
        nonce: '',
        maxFeePerGas: '',
        maxPriorityFeePerGas: '',
      })
    ).toThrow();
  });

  it('rejects malformed hex (e.g. 0xZZ) at the zod boundary', () => {
    expect(() =>
      parse({
        type: 0,
        to: TO,
        value: '0',
        data: '',
        gas: '',
        nonce: '',
        gasPrice: '0xZZ',
      })
    ).toThrow();
  });

  it('rejects invalid checksum address', () => {
    expect(() =>
      parse({
        type: 2,
        to: '0xnotanaddress',
        value: '0.1',
        data: '',
        gas: '',
        nonce: '',
        maxFeePerGas: '',
        maxPriorityFeePerGas: '',
      })
    ).toThrow();
  });

  it('rejects non-hex calldata', () => {
    expect(() =>
      parse({
        type: 2,
        to: TO,
        value: '0.1',
        data: 'notahex',
        gas: '',
        nonce: '',
        maxFeePerGas: '',
        maxPriorityFeePerGas: '',
      })
    ).toThrow();
  });

  // Scope: 5 type options (undefined / 0 / 1 / 2 / 127), Morph altfee.
  it('omits the `type` key when type is undefined ("None auto")', () => {
    const v = parse({
      type: undefined,
      to: TO,
      value: '0.001',
      data: '',
      gas: '',
      nonce: '',
    });
    const r = toRequest(v);
    expect('type' in r).toBe(false);
    expect(r.value).toBe('0.001');
  });

  it('forwards type 127 (Morph altfee) as 0x7f with feeTokenID + feeLimit strings', () => {
    const v = parse({
      type: 127,
      to: TO,
      value: '0',
      data: '',
      gas: '',
      nonce: '',
      gasPrice: '1',
      feeTokenID: '3',
      feeLimit: '1000000',
    });
    const r = toRequest(v);
    expect(r.type).toBe('0x7f');
    expect(r.gasPrice).toBe('1');
    expect(r.feeTokenID).toBe('3');
    expect(r.feeLimit).toBe('1000000');
    expect(r.maxFeePerGas).toBeUndefined();
  });

  it('type 127 accepts feeTokenID=0; omits feeLimit when blank', () => {
    const v = parse({
      type: 127,
      to: TO,
      value: '0',
      data: '',
      gas: '',
      nonce: '',
      gasPrice: '',
      feeTokenID: '0',
      feeLimit: '',
    });
    const r = toRequest(v);
    expect(r.feeTokenID).toBe('0');
    expect('feeLimit' in r).toBe(false);
  });

  it('type 127 schema rejects missing feeTokenID', () => {
    expect(() =>
      parse({
        type: 127,
        to: TO,
        value: '0',
        data: '',
        gas: '',
        nonce: '',
        gasPrice: '',
      })
    ).toThrow();
  });

  it('forwards feeTokenID/feeLimit on type 0 (always-rendered for testing)', () => {
    const v = parse({
      type: 0,
      to: TO,
      value: '0',
      data: '',
      gas: '',
      nonce: '',
      gasPrice: '',
      feeTokenID: '7',
      feeLimit: '42',
    });
    const r = toRequest(v);
    expect(r.type).toBe('0x0');
    expect(r.feeTokenID).toBe('7');
    expect(r.feeLimit).toBe('42');
  });

  it('forwards feeTokenID on type undefined when filled', () => {
    const v = parse({
      type: undefined,
      to: TO,
      value: '0',
      data: '',
      gas: '',
      nonce: '',
      feeTokenID: '1',
    });
    const r = toRequest(v);
    expect('type' in r).toBe(false);
    expect(r.feeTokenID).toBe('1');
    expect('feeLimit' in r).toBe(false);
  });

  it('omits feeTokenID/feeLimit when blank on non-127 types', () => {
    const v = parse({
      type: 2,
      to: TO,
      value: '0',
      data: '',
      gas: '',
      nonce: '',
      maxFeePerGas: '',
      maxPriorityFeePerGas: '',
      feeTokenID: '',
      feeLimit: '',
    });
    const r = toRequest(v);
    expect('feeTokenID' in r).toBe(false);
    expect('feeLimit' in r).toBe(false);
  });

  it('schema accepts each of the 5 type cases', () => {
    const baseInput = { to: TO, value: '0.001', data: '', gas: '', nonce: '' };
    expect(() => parse({ ...baseInput, type: undefined })).not.toThrow();
    expect(() => parse({ ...baseInput, type: 0, gasPrice: '' })).not.toThrow();
    expect(() => parse({ ...baseInput, type: 1, gasPrice: '' })).not.toThrow();
    expect(() =>
      parse({ ...baseInput, type: 2, maxFeePerGas: '', maxPriorityFeePerGas: '' })
    ).not.toThrow();
    expect(() =>
      parse({ ...baseInput, type: 127, gasPrice: '', feeTokenID: '0' })
    ).not.toThrow();
  });

  it('schema rejects unknown numeric type values', () => {
    expect(() =>
      parse({
        type: 99,
        to: TO,
        value: '0.001',
        data: '',
        gas: '',
        nonce: '',
      })
    ).toThrow();
  });
});
