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

