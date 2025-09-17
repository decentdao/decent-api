import { Address } from 'viem';

type Operator = 'gte' | 'gt' | 'eq' | 'lt' | 'lte';

export type ERC20Verification = {
  type: 'erc20';
  contract: Address;
  amount: string;
  operator: Operator;
};

export type ERC721Verification = {
  type: 'erc721';
  contract: Address;
  tokenId?: string;
  amount: string;
  operator: Operator;
};

export type ERC1155Verification = {
  type: 'erc1155';
  contract: Address;
  tokenId: string;
  amount: string;
  operator: Operator;
};

export type KycVerification = {
  type: 'kyc';
  provider: 'sumsub';
  levelName?: string;
};

export type WhitelistVerification = {
  type: 'whitelist';
  allowedAddresses: Address[];
};

export type VerificationMethod =
  | ERC20Verification
  | ERC721Verification
  | ERC1155Verification
  | KycVerification
  | WhitelistVerification;

export type TokenSaleVerification = {
  operator: 'AND' | 'OR';
  methods: VerificationMethod[];
};

export type CheckResult = {
  eligible: boolean;
  reason?: string;
  kycUrl?: string;
};
