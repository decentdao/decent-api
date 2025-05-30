import { Address } from 'viem';

export type EtherscanContractSource = {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: Address;
  SimilarMatch: string;
  SwarmSource: string;
};

export type EtherscanResponse<T> = {
  status: string;
  message: string;
  result: T;
};
