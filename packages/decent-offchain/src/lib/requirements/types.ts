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

export type ERC20Requirement = BaseRequirement & {
  type: TokenSaleRequirementType.ERC20;
  tokenAddress: Address;
  amount: string;
};

export type ERC721Requirement = BaseRequirement & {
  type: TokenSaleRequirementType.ERC721;
  tokenAddress: Address;
  amount: string;
};

export type ERC1155Requirement = BaseRequirement & {
  type: TokenSaleRequirementType.ERC1155;
  tokenAddress: Address;
  tokenId: number;
  amount: string;
};

export type WhitelistRequirement = BaseRequirement & {
  type: TokenSaleRequirementType.WHITELIST;
  addresses: Address[];
};

export type KYCRequirement = BaseRequirement & {
  type: TokenSaleRequirementType.KYC;
  provider: string;
  levelName: string;
};

export type TokenSaleRequirements = {
  buyerRequirements: (
    | ERC20Requirement
    | ERC721Requirement
    | ERC1155Requirement
    | WhitelistRequirement
  )[];
  kyc: KYCRequirement | null;
  orOutOf?: number; // Number of requirements that must be met, undefined means all
};

export type CheckResult = {
  eligible: boolean;
  kycUrl?: string;
  ineligibleReason?: string;
};
