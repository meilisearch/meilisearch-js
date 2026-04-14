import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import { Meilisearch } from "../src/index.js";

let adminClient: Meilisearch;
let masterClient: Meilisearch;

const DYNAMIC_SEARCH_RULE_UID = "movie-rule";
const DYNAMIC_SEARCH_RULE_PATCH = {
  actions: [
    {
      selector: {
        indexUid: "movies",
        id: "1",
      },
      action: {
        type: "pin",
        position: 1,
      },
    },
  ],
} as const;

beforeAll(async () => {
  adminClient = await getClient("Admin");
  masterClient = await getClient("Master");
  const dynamicSearchRulesFeature = {
    dynamicSearchRules: true,
  } as unknown as Parameters<Meilisearch["updateExperimentalFeatures"]>[0];
  await masterClient.updateExperimentalFeatures(dynamicSearchRulesFeature);
});

afterAll(async () => {
  const response = await masterClient.getDynamicSearchRules();
  for (const rule of response.results) {
    await masterClient.deleteDynamicSearchRule(rule.uid);
  }
});

describe("dynamic search rules", () => {
  it("can list dynamic search rules", async () => {
    const response = await adminClient.getDynamicSearchRules({
      offset: 0,
      limit: 20,
      filter: { attributePatterns: [DYNAMIC_SEARCH_RULE_UID] },
    });
    expect(response).toHaveProperty("results");
    expect(response.results).toBeInstanceOf(Array);
  });

  it("can create or update a dynamic search rule with patch payload", async () => {
    const response = await adminClient.updateDynamicSearchRule(
      DYNAMIC_SEARCH_RULE_UID,
      DYNAMIC_SEARCH_RULE_PATCH,
    );

    expect(response).toHaveProperty("uid", DYNAMIC_SEARCH_RULE_UID);
    expect(response).toHaveProperty(
      "actions",
      DYNAMIC_SEARCH_RULE_PATCH.actions,
    );
  });

  it("can fetch a dynamic search rule", async () => {
    await adminClient.updateDynamicSearchRule(
      DYNAMIC_SEARCH_RULE_UID,
      DYNAMIC_SEARCH_RULE_PATCH,
    );

    const response = await adminClient.getDynamicSearchRule(
      DYNAMIC_SEARCH_RULE_UID,
    );

    expect(response).toHaveProperty("uid", DYNAMIC_SEARCH_RULE_UID);
    expect(response).toHaveProperty(
      "actions",
      DYNAMIC_SEARCH_RULE_PATCH.actions,
    );
  });

  it("can delete a dynamic search rule", async () => {
    await adminClient.updateDynamicSearchRule(
      DYNAMIC_SEARCH_RULE_UID,
      DYNAMIC_SEARCH_RULE_PATCH,
    );

    const response = await adminClient.deleteDynamicSearchRule(
      DYNAMIC_SEARCH_RULE_UID,
    );

    expect(response).toBeUndefined();
  });
});
