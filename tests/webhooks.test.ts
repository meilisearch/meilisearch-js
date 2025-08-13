import { expect, it, describe, beforeAll, afterAll } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import {
  Meilisearch,
  type WebhookCreatePayload,
  type WebhookUpdatePayload,
} from "../src/index.js";

let adminClient: Meilisearch;

beforeAll(async () => {
  adminClient = await getClient("Admin");
});

afterAll(async () => {
  const response = await adminClient.getWebhooks();
  for (const webhook of response.results) {
    await adminClient.deleteWebhook(webhook.uuid);
  }
});

const WEBHOOK_PAYLOAD = {
  url: "https://example.com",
  headers: {
    authorization: "TOKEN",
  },
} satisfies WebhookCreatePayload;

describe("webhooks", () => {
  it("can list webhooks", async () => {
    const response = await adminClient.getWebhooks();
    expect(response).toHaveProperty("results");
    expect(response.results).toBeInstanceOf(Array);
  });

  it("can create a webhook", async () => {
    const response = await adminClient.createWebhook(WEBHOOK_PAYLOAD);
    expect(response).toHaveProperty("uuid");
    expect(response).toHaveProperty("url", WEBHOOK_PAYLOAD.url);
    expect(response).toHaveProperty("headers", WEBHOOK_PAYLOAD.headers);
    expect(response).toHaveProperty("isEditable", true);
  });

  it("can fetch a webhook", async () => {
    const createdWebhook = await adminClient.createWebhook(WEBHOOK_PAYLOAD);
    const response = await adminClient.getWebhook(createdWebhook.uuid);
    expect(response).toHaveProperty("uuid", createdWebhook.uuid);
    expect(response).toHaveProperty("url", WEBHOOK_PAYLOAD.url);
    expect(response).toHaveProperty("headers", WEBHOOK_PAYLOAD.headers);
  });

  it("can update a webhook", async () => {
    const updatedWebhook = {
      ...WEBHOOK_PAYLOAD,
      url: "https://example.com/updated",
      headers: {
        authorization: "UPDATED TOKEN",
      },
    } satisfies WebhookUpdatePayload;

    const createdWebhook = await adminClient.createWebhook(WEBHOOK_PAYLOAD);
    const response = await adminClient.updateWebhook(
      createdWebhook.uuid,
      updatedWebhook,
    );

    expect(response).toHaveProperty("url", updatedWebhook.url);
    expect(response).toHaveProperty("headers", updatedWebhook.headers);
  });

  it("can update a webhook without updating the URL", async () => {
    const updatedWebhook = {
      ...WEBHOOK_PAYLOAD,
      headers: {
        authorization: "UPDATED TOKEN",
      },
    } satisfies WebhookUpdatePayload;

    const createdWebhook = await adminClient.createWebhook(WEBHOOK_PAYLOAD);
    const response = await adminClient.updateWebhook(
      createdWebhook.uuid,
      updatedWebhook,
    );

    expect(response).toHaveProperty("url", WEBHOOK_PAYLOAD.url);
    expect(response).toHaveProperty("headers", updatedWebhook.headers);
  });

  it("can delete a webhook", async () => {
    const createdWebhook = await adminClient.createWebhook(WEBHOOK_PAYLOAD);
    const deleteResponse = await adminClient.deleteWebhook(createdWebhook.uuid);
    expect(deleteResponse).toBeUndefined();

    const listResponse = await adminClient.getWebhooks();
    expect(listResponse.results).not.toContainEqual(createdWebhook);
  });
});
