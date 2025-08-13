import type { SafeOmit } from "./shared.js";

export type Webhook = {
  uuid: string;
  url: string;
  headers?: Record<string, string>;
  isEditable: boolean;
};

export type WebhookPayload = SafeOmit<
  Webhook,
  "uuid" | "isEditable" | "url"
> & {
  url?: string;
};
