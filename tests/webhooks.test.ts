import { expect, test, describe, beforeEach, afterAll } from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
import {
    clearAllIndexes,
    config,
    getClient,
} from "./utils/meilisearch-test-utils.js";

beforeEach(async () => {
    await clearAllIndexes(config);
});

afterAll(() => {
    return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
    "Test on webhooks",
    ({ permission }) => {
          beforeEach(async () => {
                  const client = await getClient("Master");
                  await clearAllIndexes(config);

                           // Clean up any existing webhooks
                           try {
                                     const webhooks = await client.getWebhooks();
                                     await Promise.all(
                                                 webhooks.results.map((webhook) => client.deleteWebhook(webhook.uid))
                                               );
                           } catch {
                                     // Ignore errors if webhooks endpoint doesn't exist yet
                           }
          });

      test(`${permission} key: get webhooks`, async () => {
              const client = await getClient(permission);
              const webhooks = await client.getWebhooks();

                 expect(webhooks).toHaveProperty("results");
              expect(webhooks).toHaveProperty("offset");
              expect(webhooks).toHaveProperty("limit");
              expect(webhooks).toHaveProperty("total");
              expect(Array.isArray(webhooks.results)).toBe(true);
      });

      test(`${permission} key: create webhook`, async () => {
              const client = await getClient(permission);
              const webhook = await client.createWebhook({
                        url: "https://example.com/webhook",
                        headers: {
                                    "Authorization": "Bearer token123",
                                    "Content-Type": "application/json",
                        },
              });

                 expect(webhook).toHaveProperty("uid");
              expect(webhook).toHaveProperty("url", "https://example.com/webhook");
              expect(webhook).toHaveProperty("headers");
              expect(webhook.createdAt).toBeInstanceOf(Date);
              expect(webhook.updatedAt).toBeInstanceOf(Date);
      });

      test(`${permission} key: get webhook`, async () => {
              const client = await getClient(permission);
              const createdWebhook = await client.createWebhook({
                        url: "https://example.com/test-webhook",
                        headers: {
                                    "X-Custom-Header": "test-value",
                        },
              });

                 const webhook = await client.getWebhook(createdWebhook.uid);

                 expect(webhook).toHaveProperty("uid", createdWebhook.uid);
              expect(webhook).toHaveProperty("url", "https://example.com/test-webhook");
              expect(webhook.createdAt).toBeInstanceOf(Date);
              expect(webhook.updatedAt).toBeInstanceOf(Date);
      });

      test(`${permission} key: update webhook`, async () => {
              const client = await getClient(permission);
              const createdWebhook = await client.createWebhook({
                        url: "https://example.com/original-webhook",
                        headers: {
                                    "Authorization": "Bearer original
