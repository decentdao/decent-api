import { getEip1193ProviderRequestFunc } from './decodeTxData';

/**
 * Detects if the address is an ERC20 contract and returns its symbol and decimals if so.
 */
export async function getErc20Meta(
  chainId: number,
  address: string,
): Promise<{ symbol: string; decimals: number } | undefined> {
  const provider = getEip1193ProviderRequestFunc(chainId);

  // ERC20 minimal ABI for symbol() and decimals()
  const symbolCall = {
    method: 'eth_call',
    params: [
      {
        to: address,
        data: '0x95d89b41', // symbol()
      },
      'latest',
    ],
  };
  const decimalsCall = {
    method: 'eth_call',
    params: [
      {
        to: address,
        data: '0x313ce567', // decimals()
      },
      'latest',
    ],
  };

  try {
    // symbol() returns bytes32 or string, handle both
    const symbolHex = (await provider(symbolCall)) as string;
    let symbol: string;
    if (symbolHex && symbolHex !== '0x') {
      // Try to decode as string (strip 0x and decode)
      const hex = symbolHex.startsWith('0x') ? symbolHex.slice(2) : symbolHex;
      // Remove trailing zeros and decode as utf8
      symbol = Buffer.from(hex.replace(/(00)+$/, ''), 'hex')
        .toString('utf8')
        .replace(/\0/g, '');
      if (!symbol) symbol = hex;
    } else {
      return undefined;
    }

    const decimalsHex = (await provider(decimalsCall)) as string;
    if (!decimalsHex || decimalsHex === '0x') return undefined;
    const decimals = parseInt(decimalsHex, 16);

    return { symbol, decimals };
  } catch (error) {
    console.error(`Error fetching ERC20 metadata for ${address} on chain ${chainId}:`, error);
    // Not an ERC20 or not implemented
    return undefined;
  }
}

export async function humanReadableErc20Value(
  meta: { symbol: string; decimals: number },
  value: bigint,
): Promise<{ symbol: string; value: string }> {
  const divisor = 10n ** BigInt(meta.decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  const fractionStr = fraction.toString().padStart(meta.decimals, '0').replace(/0+$/, '');
  const humanReadable = fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString();

  return {
    symbol: meta.symbol,
    value: humanReadable,
  };
}

export async function humanReadableErc20ValueOnChain(
  chainId: number,
  address: string,
  value: bigint,
): Promise<{ symbol: string; value: string } | undefined> {
  const meta = await getErc20Meta(chainId, address);
  if (!meta) return undefined;

  return humanReadableErc20Value(meta, value);
}

/**
 * Converts a bigint value (wei) to a human-readable ETH string.
 */
export function humanReadableNativeTokenValue(value: bigint): string {
  const decimals = 18n;
  const divisor = 10n ** decimals;
  const whole = value / divisor;
  const fraction = value % divisor;
  // Pad fraction with leading zeros, then trim trailing zeros
  const fractionStr = fraction.toString().padStart(Number(decimals), '0').replace(/0+$/, '');
  return fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString();
}
