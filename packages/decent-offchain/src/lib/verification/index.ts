import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, TokenSaleVerification } from './types';
import { whitelistCheck } from './methods/whitelist';
import { erc20Check } from './methods/erc20';
import { erc721Check } from './methods/erc721';
import { erc1155Check } from './methods/erc1155';
import { kycCheck } from './methods/kyc';

export async function verifier(
  chainId: SupportedChainId,
  address: Address,
  requirements: TokenSaleVerification,
): Promise<CheckResult> {
  const results = await Promise.all(
    requirements.methods.map(method => {
      const { type } = method;
      if (type === 'whitelist') return whitelistCheck(address, method);
      if (type === 'erc20') return erc20Check(chainId, address, method);
      if (type === 'erc721') return erc721Check(chainId, address, method);
      if (type === 'erc1155') return erc1155Check(chainId, address, method);
      if (type === 'kyc') return kycCheck(address, method);
      throw new Error(`Unsupported requirements type check: ${type}`);
    }),
  );

  const eligible =
    requirements.operator === 'AND'
      ? results.every(r => r.eligible)
      : results.some(r => r.eligible);

  const reason = results
    .filter(r => !r.eligible && r.reason)
    .map(r => r.reason!)
    .join(', ');
  const kycUrl = results.find(r => r.kycUrl)?.kycUrl;

  return { eligible, kycUrl, reason };
}
