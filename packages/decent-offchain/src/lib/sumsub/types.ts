export type SumsubRequest = {
  method: 'GET' | 'POST';
  endpoint: string;
  body: string;
};

export type WebSdkUrlResponse = {
  url: string;
};

export type AccessTokenResponse = {
  token: string;
  userId: string;
};

type SumsubError = {
  code: number;
  correlationId: string;
  errorCode: number;
  errorName: string;
  description: string;
};

export type KYCResponseType = 'url' | 'token';

export type SumsubResponse<T> = T | SumsubError;

export type SumsubWebhookPayload = {
  applicantId: string;
  inspectionId: string;
  externalUserId: string;
  type: SumsubWebhookEventType;
  reviewResult?: {
    reviewAnswer: 'GREEN' | 'RED';
    rejectLabels?: string[];
    reviewRejectType?: string;
  };
  reviewStatus?: 'init' | 'pending' | 'completed' | 'onHold';
  levelName?: string;
  correlationId: string;
  createdAt: string;
  sandboxMode?: boolean;
};

export type SumsubWebhookEventType =
  | 'applicantCreated'
  | 'applicantPending'
  | 'applicantReviewed'
  | 'applicantOnHold'
  | 'applicantActionPending'
  | 'applicantActionReviewed'
  | 'applicantActionOnHold'
  | 'applicantPersonalInfoChanged'
  | 'applicantTagsChanged'
  | 'applicantActivated'
  | 'applicantDeactivated'
  | 'applicantDeleted'
  | 'applicantReset'
  | 'applicantPrechecked'
  | 'applicantLevelChanged'
  | 'applicantWorkflowCompleted';
