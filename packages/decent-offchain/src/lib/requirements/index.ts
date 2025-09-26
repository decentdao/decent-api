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
    const { eligible, ineligibleReason, kycUrl } = await kycCheck(address, requirements.kyc);
    if (!eligible) {
      return {
        eligible: false,
        ineligibleReason,
        kycUrl,
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

  const failedRequirements = onchainRequirements.filter(r => !r.eligible && r.ineligibleReason);
  const ineligibleReason = eligible
    ? undefined
    : [
        `${passedRequirements} out of ${requirements.orOutOf ?? requirements.buyerRequirements.length} requirements met`,
        ...failedRequirements.map(r => r.ineligibleReason),
      ].join('. ');

  return {
    eligible,
    ineligibleReason,
  };
}
