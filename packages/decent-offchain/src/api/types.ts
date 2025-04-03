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

export type Health = string;

export type ChainId = number;

export type User = {
  address: Address;
  ensName: string | null;
};

export type Nonce = {
  nonce: string;
};

export type Logout = string;

export type Dao = {
  chainId: string;
  address: Address;
};

export type NewProposalBody = {
  title: string;
  body: string;
  cycle?: string;
  votingStrategy?: string;
};

export type UpdateProposalBody = {
  title?: string;
  body?: string;
  cycle?: string;
  votingStrategy?: string;
};
