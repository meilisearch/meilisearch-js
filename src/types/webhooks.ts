export type Webhook = {
  /** A v4 uuid Meilisearch automatically generates when you create a new webhook */
  uuid: string;
  /** The URL Meilisearch should notify whenever it completes a task */
  url: string;
  /** An object with HTTP headers and their values */
  headers?: Record<string, string>;
  /**
   * `true` for all webhooks created via the API and `false` for reserved
   * webhooks
   */
  isEditable: boolean;
};

export type WebhookCreatePayload = {
  /** The URL Meilisearch should notify whenever it completes a task */
  url: string;
  /** An object with HTTP headers and their values */
  headers?: Record<string, string>;
};

export type WebhookUpdatePayload = {
  /** The URL Meilisearch should notify whenever it completes a task */
  url?: string;
  /** An object with HTTP headers and their values */
  headers?: Record<string, string>;
};
