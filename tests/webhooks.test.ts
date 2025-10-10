import { createServer } from "node:http";
import { expect, it, describe, beforeAll, afterAll } from "vitest";
import { MASTER_KEY, HOST, assert } from "./utils/meilisearch-test-utils.js";
import {
  type WebhookCreatePayload,
  type WebhookUpdatePayload,
  MeiliSearch,
  WebhookTaskClient,
} from "../src/index.js";
import { createUnzip } from "node:zlib";

const SERVER_PORT = 3012;
const SERVER_HOST = "127.0.0.1";

const webhookTaskClient = new WebhookTaskClient();
const client = new MeiliSearch({
  host: HOST,
  apiKey: MASTER_KEY,
  webhookTaskClient,
});

const unzip = createUnzip();

const server = createServer((req, res) => {
  (async () => {
    const buffers: Buffer[] = [];

    for await (const chunk of req.pipe(unzip).iterator()) {
      buffers.push(chunk as Buffer);
    }

    const responseStr = Buffer.concat(buffers).toString();
    console.log({ responseStr });

    webhookTaskClient.pushTasksString(responseStr);

    res.writeHead(200);
  })()
    .catch((reason) => {
      console.error(reason);
      res.writeHead(500);
    })
    .finally(() => {
      res.end();
    });
});

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server.listen(SERVER_PORT, SERVER_HOST, resolve);
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err !== undefined) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  const response = await client.getWebhooks();
  for (const webhook of response.results) {
    if (webhook.isEditable) {
      await client.deleteWebhook(webhook.uuid);
    }
  }
});

const WEBHOOK_PAYLOAD = {
  // TODO: what about linux?
  // https://docs.docker.com/desktop/features/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host
  url: `http://172.17.0.1:${SERVER_PORT}`,
  headers: { authorization: "TOKEN" },
} satisfies WebhookCreatePayload;

it("webhook works", async () => {
  console.log("test");
  await client.createWebhook(WEBHOOK_PAYLOAD);
  const INDEX_NAME = "idx_webhook_test";
  const task = await client.createIndex(INDEX_NAME).waitTask();
  assert.isTask(task);
  const task2 = await client.deleteIndex(INDEX_NAME).waitTask();
  assert.isTask(task2);
});

describe.skip("webhooks", () => {
  it("can list webhooks", async () => {
    const response = await client.getWebhooks();
    expect(response).toHaveProperty("results");
    expect(response.results).toBeInstanceOf(Array);
  });

  it("can create a webhook", async () => {
    const response = await client.createWebhook(WEBHOOK_PAYLOAD);
    expect(response).toHaveProperty("uuid");
    expect(response).toHaveProperty("url", WEBHOOK_PAYLOAD.url);
    expect(response).toHaveProperty("headers", WEBHOOK_PAYLOAD.headers);
    expect(response).toHaveProperty("isEditable", true);
  });

  it("can fetch a webhook", async () => {
    const createdWebhook = await client.createWebhook(WEBHOOK_PAYLOAD);
    const response = await client.getWebhook(createdWebhook.uuid);
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

    const createdWebhook = await client.createWebhook(WEBHOOK_PAYLOAD);
    const response = await client.updateWebhook(
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

    const createdWebhook = await client.createWebhook(WEBHOOK_PAYLOAD);
    const response = await client.updateWebhook(
      createdWebhook.uuid,
      updatedWebhook,
    );

    expect(response).toHaveProperty("url", WEBHOOK_PAYLOAD.url);
    expect(response).toHaveProperty("headers", updatedWebhook.headers);
  });

  it("can delete a webhook", async () => {
    const createdWebhook = await client.createWebhook(WEBHOOK_PAYLOAD);
    const deleteResponse = await client.deleteWebhook(createdWebhook.uuid);
    expect(deleteResponse).toBeUndefined();

    const listResponse = await client.getWebhooks();
    expect(listResponse.results).not.toContainEqual(createdWebhook);
  });
});
