import { Address } from 'viem';

export enum TokenSaleRequirementType {
  KYC = 'kyc',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  WHITELIST = 'whitelist',
}

type BaseRequirement = {
  type: TokenSaleRequirementType;
};

export interface ERC20Requirement extends BaseRequirement {
  type: TokenSaleRequirementType.ERC20;
  tokenAddress: Address;
  amount: bigint;
}

export interface ERC721Requirement extends BaseRequirement {
  type: TokenSaleRequirementType.ERC721;
  tokenAddress: Address;
  amount: bigint;
}

export interface ERC1155Requirement extends BaseRequirement {
  type: TokenSaleRequirementType.ERC1155;
  tokenAddress: Address;
  tokenId: bigint;
  amount: bigint;
}

export interface WhitelistRequirement extends BaseRequirement {
  type: TokenSaleRequirementType.WHITELIST;
  addresses: Address[];
}

export interface KYCRequirement extends BaseRequirement {
  type: TokenSaleRequirementType.KYC;
  provider: string;
  levelName: string;
}

export interface TokenSaleRequirements {
  tokenSaleAddress: Address;
  tokenSaleName: string;
  buyerRequirements: (
    | ERC20Requirement
    | ERC721Requirement
    | ERC1155Requirement
    | WhitelistRequirement
  )[];
  kyc: KYCRequirement | null;
  orOutOf?: number; // Number of requirements that must be met, undefined means all
}

export type CheckResult = {
  eligible: boolean;
  reason?: string;
  kycUrl?: string;
};
