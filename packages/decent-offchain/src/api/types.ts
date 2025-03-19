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

export type Me = {
  address: string;
  ensName: string | null;
};

export type Nonce = {
  nonce: string;
};

export type Logout = string;
