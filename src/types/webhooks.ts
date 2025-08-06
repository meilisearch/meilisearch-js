export type Webhook = {
  uuid: string;
  url: string;
  headers?: Record<string, string>;
  isEditable: boolean;
};

export type WebhookPayload = Omit<Webhook, "uuid" | "isEditable">;
