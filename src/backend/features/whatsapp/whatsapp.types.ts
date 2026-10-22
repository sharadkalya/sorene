export interface TestNotificationResult {
  /** `accepted` means Meta queued the message; final delivery arrives via webhook statuses. */
  status: 'accepted';
  messageId: string;
  template: string;
  recipient: string;
}

export interface WebhookStatusUpdate {
  messageId: string;
  status: string;
  recipient?: string;
  errorCodes: number[];
}
