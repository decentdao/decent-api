import { Address } from 'viem';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    type?: string;
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type Meta = {
  name: string;
  version: string;
};

export const SUPPORTED_CHAIN_IDS = [1, 8453, 10, 137, 11155111] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

export type Health = string;

export type ChainId = number;

export type Permissions = {
  isProposer: boolean;
  isVoter: boolean;
  isSigner: boolean;
  isModerator: boolean;
};

export type User = {
  address: Address;
  ensName: string | null;
  permissions?: Permissions;
};

export type Nonce = {
  nonce: string;
};

export type Logout = string;
