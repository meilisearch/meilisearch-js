import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import { Meilisearch, type SearchRuleUpdatePayload } from "../src/index.js";

let adminClient: Meilisearch;
let masterClient: Meilisearch;

const SEARCH_RULE_UID = "movie-rule";
const SEARCH_RULE_PATCH: SearchRuleUpdatePayload = {
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
};

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
      filter: { attributePatterns: [SEARCH_RULE_UID] },
    });
    expect(response).toHaveProperty("results");
    expect(response.results).toBeInstanceOf(Array);
  });

  it("can create or update a dynamic search rule with patch payload", async () => {
    const response = await adminClient.updateDynamicSearchRule(
      SEARCH_RULE_UID,
      SEARCH_RULE_PATCH,
    );

    expect(response).toHaveProperty("uid", SEARCH_RULE_UID);
    expect(response).toHaveProperty("actions", SEARCH_RULE_PATCH.actions);
  });

  it("can fetch a dynamic search rule", async () => {
    await adminClient.updateDynamicSearchRule(
      SEARCH_RULE_UID,
      SEARCH_RULE_PATCH,
    );

    const response = await adminClient.getDynamicSearchRule(SEARCH_RULE_UID);

    expect(response).toHaveProperty("uid", SEARCH_RULE_UID);
    expect(response).toHaveProperty("actions", SEARCH_RULE_PATCH.actions);
  });

  it("can delete a dynamic search rule", async () => {
    await adminClient.updateDynamicSearchRule(
      SEARCH_RULE_UID,
      SEARCH_RULE_PATCH,
    );

    const response = await adminClient.deleteDynamicSearchRule(SEARCH_RULE_UID);

    expect(response).toBeUndefined();
  });
});
