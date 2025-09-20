import { Address } from 'viem';
import { SupportedChainId } from 'decent-sdk';
import { CheckResult, TokenSaleRequirements, TokenSaleRequirementType } from './types';
import { whitelistCheck } from './methods/whitelist';
import { erc20Check } from './methods/erc20';
import { erc721Check } from './methods/erc721';
import { erc1155Check } from './methods/erc1155';
import { kycCheck } from './methods/kyc';

export async function checkRequirements(
  chainId: SupportedChainId,
  address: Address,
  requirements: TokenSaleRequirements,
): Promise<CheckResult> {
  // If KYC is required and not complete, return url for user to complete
  if (requirements.kyc) {
    const kycResult = await kycCheck(address, requirements.kyc);
    if (!kycResult.eligible) {
      return {
        eligible: false,
        reason: kycResult.reason,
        kycUrl: kycResult.kycUrl,
      };
    }
  }

  const onchainRequirements = await Promise.all(
    requirements.buyerRequirements.map(method => {
      const { type } = method;
      if (type === TokenSaleRequirementType.WHITELIST) return whitelistCheck(address, method);
      if (type === TokenSaleRequirementType.ERC20) return erc20Check(chainId, address, method);
      if (type === TokenSaleRequirementType.ERC721) return erc721Check(chainId, address, method);
      if (type === TokenSaleRequirementType.ERC1155) return erc1155Check(chainId, address, method);
      throw new Error(`Unsupported requirements type check: ${type}`);
    }),
  );

  const passedRequirements = onchainRequirements.filter(r => r.eligible).length;
  let eligible = false;

  if (requirements.orOutOf !== undefined) {
    eligible = passedRequirements >= requirements.orOutOf;
  } else {
    eligible = passedRequirements === requirements.buyerRequirements.length;
  }

  const failedRequirements = onchainRequirements.filter(r => !r.eligible && r.reason);
  const reason = failedRequirements.map(r => r.reason).join(', ');

  return {
    eligible,
    reason,
  };
}
