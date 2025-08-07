import { beforeAll, expect, test } from "vitest";
import { getClient, dataset } from "./utils/meilisearch-test-utils.js";
import type { ChatWorkspaceSettings } from "../src/types/types.js";

beforeAll(async () => {
  const client = await getClient("Admin");
  await client.updateExperimentalFeatures({
    chatCompletions: true,
  });
  await client
    .createIndex("movies", {
      primaryKey: "id",
    })
    .waitTask();
  await client.index("movies").addDocuments(dataset).waitTask();
});

const WORKSPACE_SETTINGS = {
  source: "openAi",
  orgId: "some-org-id",
  projectId: "some-project-id",
  apiVersion: "some-api-version",
  deploymentId: "some-deployment-id",
  baseUrl: "https://baseurl.com",
  apiKey: "sk-test-placeholder-api-key",
  prompts: {
    system:
      "You are a helpful assistant that answers questions based on the provided context.",
  },
} satisfies ChatWorkspaceSettings;

const WORKSPACE_SETTINGS_WITHOUT_API_KEY = {
  ...WORKSPACE_SETTINGS,
  // Meilisearch will hide the api key in the response
  apiKey: "sk-XXXXX...",
};

test("it can update workspace settings", async () => {
  const client = await getClient("Admin");

  const response = await client.chat("myWorkspace").update(WORKSPACE_SETTINGS);
  expect(response).toMatchObject(WORKSPACE_SETTINGS_WITHOUT_API_KEY);
});

test("it can get workspace settings", async () => {
  const client = await getClient("Admin");
  await client.chat("myWorkspace").update(WORKSPACE_SETTINGS);
  const response = await client.chat("myWorkspace").get();
  expect(response).toMatchObject(WORKSPACE_SETTINGS_WITHOUT_API_KEY);
});

test("it can list workspaces", async () => {
  const client = await getClient("Admin");
  await client.chat("myWorkspace").update(WORKSPACE_SETTINGS);
  const response = await client.getChatWorkspaces();
  expect(response.results).toEqual([{ uid: "myWorkspace" }]);
});

test("it can delete a workspace settings", async () => {
  const client = await getClient("Admin");
  await client.chat("myWorkspace").update(WORKSPACE_SETTINGS);
  await client.chat("myWorkspace").reset();
  const response = await client.getChatWorkspaces();
  expect(response.results).toEqual([{ uid: "myWorkspace" }]);
});

test("it can create a chat completion (streaming)", async () => {
  const client = await getClient("Chat");
  const stream = await client.chat("myWorkspace").streamCompletion({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: "Hello, how are you?",
      },
    ],
    stream: true,
  });

  expect(stream).toBeInstanceOf(ReadableStream);

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  try {
    let receivedData = "";
    let chunkCount = 0;
    const maxChunks = 1000; // Safety limit to prevent infinite loops

    while (chunkCount < maxChunks) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      receivedData += chunk;
      chunkCount++;
    }

    if (chunkCount >= maxChunks) {
      throw new Error(`Test exceeded maximum chunk limit of ${maxChunks}`);
    }

    expect(receivedData.length).toBeGreaterThan(0);
  } finally {
    reader.releaseLock();
  }
});
