import { beforeAll, expect, test } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import type { WorkspaceSettings } from "../src/types/types.js";

beforeAll(async () => {
  const client = await getClient("Admin");
  await client.updateExperimentalFeatures({
    chatCompletions: true,
  });
});

const WORKSPACE_SETTINGS = {
  source: "openAi",
  orgId: "some-org-id",
  projectId: "some-project-id",
  apiVersion: "some-api-version",
  deploymentId: "some-deployment-id",
  baseUrl: "https://baseurl.com",
  apiKey: "sk-abc...",
  prompts: {
    system:
      "You are a helpful assistant that answers questions based on the provided context.",
  },
} satisfies WorkspaceSettings;

const WORKSPACE_SETTINGS_WITHOUT_API_KEY = {
  ...WORKSPACE_SETTINGS,
  // Meilisearch will hide the api key in the response
  apiKey: "XXX...",
};

test("it can update workspace settings", async () => {
  const client = await getClient("Admin");

  const response = await client.updateWorkspaceSettings(
    "myWorkspace",
    WORKSPACE_SETTINGS,
  );
  expect(response).toMatchObject(WORKSPACE_SETTINGS_WITHOUT_API_KEY);
});

test("it can get workspace settings", async () => {
  const client = await getClient("Admin");
  await client.updateWorkspaceSettings("myWorkspace", WORKSPACE_SETTINGS);
  const response = await client.getWorkspaceSettings("myWorkspace");
  expect(response).toMatchObject(WORKSPACE_SETTINGS_WITHOUT_API_KEY);
});
