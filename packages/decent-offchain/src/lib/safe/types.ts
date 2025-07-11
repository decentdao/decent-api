export { type Hex } from 'viem';

export type SafeVersion = '1.4.1' | '1.3.0' | '1.2.0' | '1.1.1' | '1.0.0';

export enum OperationType {
  Call, // 0
  DelegateCall, // 1
}

export interface SafeSetupConfig {
  owners: string[];
  threshold: number;
  to?: string;
  data?: string;
  fallbackHandler?: string;
  paymentToken?: string;
  payment?: string;
  paymentReceiver?: string;
}
export interface MetaTransactionData {
  to: string;
  value: string;
  data: string;
  operation?: OperationType;
}

export interface SafeTransactionData extends MetaTransactionData {
  operation: OperationType;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: string;
  refundReceiver: string;
  nonce: number;
}

export interface SafeTransactionDataPartial extends MetaTransactionData {
  safeTxGas?: string;
  baseGas?: string;
  gasPrice?: string;
  gasToken?: string;
  refundReceiver?: string;
  nonce?: number;
}

export interface SafeSignature {
  readonly signer: string;
  readonly data: string;
  readonly isContractSignature: boolean;
  staticPart(dynamicOffset?: string): string;
  dynamicPart(): string;
}

export interface SafeTransaction {
  readonly data: SafeTransactionData;
  readonly signatures: Map<string, SafeSignature>;
  getSignature(signer: string): SafeSignature | undefined;
  addSignature(signature: SafeSignature): void;
  encodedSignatures(): string;
}

export interface SafeMessage {
  readonly data: EIP712TypedData | string;
  readonly signatures: Map<string, SafeSignature>;
  getSignature(signer: string): SafeSignature | undefined;
  addSignature(signature: SafeSignature): void;
  encodedSignatures(): string;
}

export type Transaction = TransactionBase & TransactionOptions;

export interface TransactionBase {
  to: string;
  value: string;
  data: string;
}

export interface TransactionOptions {
  from?: string;
  gasLimit?: number | string | bigint;
  gasPrice?: number | string;
  maxFeePerGas?: number | string;
  maxPriorityFeePerGas?: number | string;
  nonce?: number;
}

export interface BaseTransactionResult {
  hash: string;
}

export interface TransactionResult extends BaseTransactionResult {
  transactionResponse: unknown;
  options?: TransactionOptions;
}

export interface Eip3770Address {
  prefix: string;
  address: string;
}

export interface SafeEIP712Args {
  safeAddress: string;
  safeVersion: string;
  chainId: bigint;
  data: SafeTransactionData | EIP712TypedData | string;
}

export interface EIP712TxTypes {
  EIP712Domain: {
    type: string;
    name: string;
  }[];
  SafeTx: {
    type: string;
    name: string;
  }[];
}

export interface EIP712MessageTypes {
  EIP712Domain: {
    type: string;
    name: string;
  }[];
  SafeMessage: [
    {
      type: 'bytes';
      name: 'message';
    },
  ];
}

export type EIP712Types = EIP712TxTypes | EIP712MessageTypes;

export interface EIP712TypedDataTx {
  types: EIP712TxTypes;
  domain: {
    chainId?: string;
    verifyingContract: string;
  };
  primaryType: 'SafeTx';
  message: {
    to: string;
    value: string;
    data: string;
    operation: OperationType;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    nonce: number;
  };
}

export interface EIP712TypedDataMessage {
  types: EIP712MessageTypes;
  domain: {
    chainId?: number;
    verifyingContract: string;
  };
  primaryType: 'SafeMessage';
  message: {
    message: string;
  };
}

export enum SigningMethod {
  ETH_SIGN = 'eth_sign',
  ETH_SIGN_TYPED_DATA = 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SAFE_SIGNATURE = 'safe_sign',
}

export type SigningMethodType = SigningMethod | string;

export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: ArrayLike<number> | string;
}

export interface TypedDataTypes {
  name: string;
  type: string;
}

export type TypedMessageTypes = {
  [key: string]: TypedDataTypes[];
};

export interface EIP712TypedData {
  domain: TypedDataDomain;
  types: TypedMessageTypes;
  message: Record<string, unknown>;
  primaryType?: string;
}

export const SignatureTypes = {
  CONTRACT_SIGNATURE: 'CONTRACT_SIGNATURE',
  EOA: 'EOA',
  APPROVED_HASH: 'APPROVED_HASH',
  ETH_SIGN: 'ETH_SIGN',
} as const;

export type SignatureType = (typeof SignatureTypes)[keyof typeof SignatureTypes];

export type SafeMultisigConfirmationResponse = {
  readonly owner: string;
  readonly submissionDate: string;
  readonly transactionHash?: string;
  readonly confirmationType?: string;
  readonly signature: string;
  readonly signatureType: SignatureType;
};

export type ListResponse<T> = {
  readonly count: number;
  readonly next?: string;
  readonly previous?: string;
  readonly results: T[];
};
export type SafeMultisigConfirmationListResponse = ListResponse<SafeMultisigConfirmationResponse>;

export type DataDecoded = {
  readonly method: string;
  readonly parameters: DecodedParameters[];
};

export type DecodedParameters = {
  readonly name: string;
  readonly type: string;
  readonly value: string;
  readonly valueDecoded?: ValueDecoded[];
};

export type ValueDecoded = MetaTransactionData & {
  readonly operation: OperationType;
  readonly dataDecoded?: DataDecoded;
};

export type SafeMultisigTransactionResponse = {
  readonly safe: string;
  readonly to: string;
  readonly value: string;
  readonly data?: string;
  readonly operation: number;
  readonly gasToken: string;
  readonly safeTxGas: number;
  readonly baseGas: number;
  readonly gasPrice: string;
  readonly refundReceiver?: string;
  readonly nonce: number;
  readonly executionDate: string | null;
  readonly submissionDate: string;
  readonly modified: string;
  readonly blockNumber: number | null;
  readonly transactionHash: string | null;
  readonly safeTxHash: string;
  readonly executor: string | null;
  readonly proposer: string | null;
  readonly proposedByDelegate: string | null;
  readonly isExecuted: boolean;
  readonly isSuccessful: boolean | null;
  readonly ethGasPrice: string | null;
  readonly maxFeePerGas: string | null;
  readonly maxPriorityFeePerGas: string | null;
  readonly gasUsed: number | null;
  readonly fee: string | null;
  readonly origin: string;
  readonly dataDecoded?: DataDecoded;
  readonly confirmationsRequired: number;
  readonly confirmations?: SafeMultisigConfirmationResponse[];
  readonly trusted: boolean;
  readonly signatures: string | null;
};

export interface RelayTransaction {
  target: string;
  encodedTransaction: string;
  chainId: bigint;
  options?: MetaTransactionOptions;
}

export interface MetaTransactionOptions {
  gasLimit?: string;
  gasToken?: string;
  isSponsored?: boolean;
}

export type UserOperationV06 = {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
};

export type UserOperationV07 = {
  sender: string;
  nonce: string;
  factory?: string;
  factoryData?: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymaster?: string;
  paymasterData?: string;
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
  signature: string;
};

export type UserOperation = UserOperationV06 | UserOperationV07;

export type SafeUserOperation = {
  safe: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  validAfter: number;
  validUntil: number;
  entryPoint: string;
};

export type EstimateGasData = {
  paymasterAndData?: string;
  paymaster?: string;
  paymasterData?: string;
  maxFeePerGas?: bigint | number | string;
  maxPriorityFeePerGas?: bigint | number | string;
  preVerificationGas?: bigint | number | string;
  verificationGasLimit?: bigint | number | string;
  callGasLimit?: bigint | number | string;
  paymasterVerificationGasLimit?: bigint | number | string;
  paymasterPostOpGasLimit?: bigint | number | string;
};

export type SafeOperationOptions = {
  moduleAddress: string;
  entryPoint: string;
  chainId: bigint;
  validAfter?: number;
  validUntil?: number;
};

export type SafeOperationConfirmation = {
  readonly created: string;
  readonly modified: string;
  readonly owner: string;
  readonly signature: string;
  readonly signatureType: SignatureType;
};

export type UserOperationResponse = {
  readonly ethereumTxHash: null | string;
  readonly sender: string;
  readonly userOperationHash: string;
  readonly nonce: string;
  readonly initCode: null | string;
  readonly callData: null | string;
  readonly callGasLimit: string;
  readonly verificationGasLimit: string;
  readonly preVerificationGas: string;
  readonly maxFeePerGas: string;
  readonly maxPriorityFeePerGas: string;
  readonly paymaster: null | string;
  readonly paymasterData: null | string;
  readonly signature: string;
  readonly entryPoint: string;
};

export type SafeOperationResponse = {
  readonly created: string;
  readonly modified: string;
  readonly safeOperationHash: string;
  readonly validAfter: null | string;
  readonly validUntil: null | string;
  readonly moduleAddress: string;
  readonly confirmations?: Array<SafeOperationConfirmation>;
  readonly preparedSignature?: string;
  readonly userOperation?: UserOperationResponse;
};

export type SafeOperationConfirmationListResponse = ListResponse<SafeOperationConfirmation>;

export interface SafeOperation {
  userOperation: UserOperation;
  options: SafeOperationOptions;
  signatures: Map<string, SafeSignature>;

  addEstimations(estimations: EstimateGasData): void;
  getSafeOperation(): SafeUserOperation;
  getSignature(signer: string): SafeSignature | undefined;
  addSignature(signature: SafeSignature): void;
  encodedSignatures(): string;
  getUserOperation(): UserOperation;
  getHash(): string;
  getEIP712Type(): unknown;
}
