export type Webhook = {
  uuid: string;
  url: string;
  headers?: Record<string, string>;
  isEditable: boolean;
};

export type WebhookCreation = Omit<Webhook, "uuid" | "isEditable">;
