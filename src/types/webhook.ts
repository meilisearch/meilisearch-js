export interface Webhook {
    uid: string;
    url: string;
    headers?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}

export interface WebhookCreation {
    url: string;
    headers?: Record<string, string>;
}

export interface WebhookUpdate {
    url?: string;
    headers?: Record<string, string>;
}

export interface WebhooksQuery {
    offset?: number;
    limit?: number;
    [key: string]: string | number | undefined;
}

export interface WebhooksResults {
    results: Webhook[];
    offset: number;
    limit: number;
    total: number;
}
