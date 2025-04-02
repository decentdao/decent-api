import { Address } from "viem";

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    type?: string;
    message: string;
    code?: string;
    details?: any;
  };
};

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

export type Proposal = {
  id: string;
  title: string;
  body: string;
  authorAddress: Address;
};
