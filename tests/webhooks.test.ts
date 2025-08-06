import { expect, it, describe, beforeAll, afterAll } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import { Meilisearch, type WebhookPayload } from "../src/index.js";

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

describe("webhooks", () => {
  it("can list webhooks", async () => {
    const response = await adminClient.getWebhooks();
    expect(response).toHaveProperty("results");
    expect(response.results).toBeInstanceOf(Array);
  });

  it("can create a webhook", async () => {
    const webhook = {
      url: "https://example.com",
      headers: {
        authorization: "TOKEN",
      },
    } satisfies WebhookPayload;
    const response = await adminClient.createWebhook(webhook);
    expect(response).toHaveProperty("uuid");
    expect(response).toHaveProperty("url", webhook.url);
    expect(response).toHaveProperty("headers", webhook.headers);
    expect(response).toHaveProperty("isEditable", true);
  });

  it("can update a webhook", async () => {
    const webhook = {
      url: "https://example.com",
      headers: {
        authorization: "TOKEN",
      },
    } satisfies WebhookPayload;
    const updatedWebhook = {
      ...webhook,
      url: "https://example.com/updated",
      headers: {
        authorization: "UPDATED TOKEN",
      },
    } satisfies WebhookPayload;

    const createdWebhook = await adminClient.createWebhook(webhook);
    const response = await adminClient.updateWebhook(
      createdWebhook.uuid,
      updatedWebhook,
    );

    expect(response).toHaveProperty("url", updatedWebhook.url);
    expect(response).toHaveProperty("headers", updatedWebhook.headers);
  });

  it("can delete a webhook", async () => {
    const webhook = {
      url: "https://example.com",
      headers: {
        authorization: "TOKEN",
      },
    } satisfies WebhookPayload;

    const createdWebhook = await adminClient.createWebhook(webhook);
    const deleteResponse = await adminClient.deleteWebhook(createdWebhook.uuid);
    expect(deleteResponse).toBeUndefined();

    const listResponse = await adminClient.getWebhooks();
    expect(listResponse.results).not.toContainEqual(createdWebhook);
  });
});
