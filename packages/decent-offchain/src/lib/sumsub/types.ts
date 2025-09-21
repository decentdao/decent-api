export type SumsubRequest = {
  method: 'GET' | 'POST';
  endpoint: string;
  body: string;
};

export type ResponseWebSdkUrl = {
  url: string;
};

type SumsubError = {
  code: number;
  correlationId: string;
  errorCode: number;
  errorName: string;
  description: string;
};

export type SumsubResponse<T> = T | SumsubError;
