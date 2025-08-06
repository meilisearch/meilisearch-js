# Webhook Error Codes to Add

The following webhook-related error codes need to be added to `src/types/types.ts` in the `ErrorStatusCode` object:

```typescript
/** @see https://www.meilisearch.com/docs/reference/errors/error_codes#webhook_not_found */
WEBHOOK_NOT_FOUND: "webhook_not_found",

/** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_webhook_url */
INVALID_WEBHOOK_URL: "invalid_webhook_url",

/** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_webhook_headers */
INVALID_WEBHOOK_HEADERS: "invalid_webhook_headers",

/** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_webhook_url */
MISSING_WEBHOOK_URL: "missing_webhook_url",
```

## Webhook API Methods to Add

The following webhook API methods need to be added to `src/meilisearch.ts`:

1. `getWebhooks(parameters?: WebhooksQuery): Promise<WebhooksResults>`
2. 2. `getWebhook(webhookUid: string): Promise<Webhook>`
   3. 3. `createWebhook(options: WebhookCreation): Promise<Webhook>`
      4. 4. `updateWebhook(webhookUid: string, options: WebhookUpdate): Promise<Webhook>`
         5. 5. `deleteWebhook(webhookUid: string): Promise<void>`
           
            6. These methods should follow the same patterns as existing API methods in the class.
           
            7. ## Implementation Status
           
            8. ✅ **Completed:**
            9. - `src/types/webhook.ts` - TypeScript interfaces for webhook operations
               - - `tests/webhooks.test.ts` - Comprehensive test suite (31 tests)
                 - - `src/types/index.ts` - Export statement for webhook types
                  
                   - 🚧 **Still needed:**
                   - - Add webhook error codes to `src/types/types.ts`
                     - - Add webhook API methods to `src/meilisearch.ts`
                       - - Add webhook type imports to `src/meilisearch.ts`
                        
                         - This implements webhook API support for Meilisearch 1.17.0 as requested in issue #1991.
