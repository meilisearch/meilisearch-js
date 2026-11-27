import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import { Meilisearch, type SearchRuleUpdatePayload } from "../src/index.js";

let adminClient: Meilisearch;
let masterClient: Meilisearch;

const SEARCH_RULE_UID = "movie-rule";
const SEARCH_RULE_PATCH: SearchRuleUpdatePayload = {
  description: "Pin a movie for invoice searches",
  precedence: 1,
  active: true,
  conditions: {
    query: { words: "invoice" },
    filter: {
      values: {
        color: "red",
        category: "shirt",
      },
    },
  },
  actions: {
    pin: [
      {
        id: "1",
        position: 1,
        indexUid: "movies",
      },
    ],
  },
};

beforeAll(async () => {
  adminClient = await getClient("Admin");
  masterClient = await getClient("Master");
  await masterClient.updateExperimentalFeatures({
    dynamicSearchRules: true,
  });
  await masterClient.deleteAllDynamicSearchRules().waitTask();
});

afterAll(async () => {
  await masterClient.deleteAllDynamicSearchRules().waitTask();
});

describe("dynamic search rules", () => {
  it("can create or update a dynamic search rule with patch payload", async () => {
    const task = await adminClient
      .updateDynamicSearchRule(SEARCH_RULE_UID, SEARCH_RULE_PATCH)
      .waitTask();

    expect(task).toHaveProperty("type", "dsrUpdate");
    expect(task).toHaveProperty("status", "succeeded");
  });

  it("can list dynamic search rules", async () => {
    await adminClient
      .updateDynamicSearchRule(SEARCH_RULE_UID, SEARCH_RULE_PATCH)
      .waitTask();

    const response = await adminClient.getDynamicSearchRules({
      offset: 0,
      limit: 20,
      filter: { query: "invoice" },
    });

    expect(response).toHaveProperty("results");
    expect(response.results).toBeInstanceOf(Array);
    expect(response.results.some((r) => r.uid === SEARCH_RULE_UID)).toBe(true);
  });

  it("can fetch a dynamic search rule", async () => {
    await adminClient
      .updateDynamicSearchRule(SEARCH_RULE_UID, SEARCH_RULE_PATCH)
      .waitTask();

    const response = await adminClient.getDynamicSearchRule(SEARCH_RULE_UID);

    expect(response).toHaveProperty("uid", SEARCH_RULE_UID);
    expect(response).toHaveProperty("precedence", SEARCH_RULE_PATCH.precedence);
    expect(response).toHaveProperty("actions", SEARCH_RULE_PATCH.actions);
    expect(response.conditions).toMatchObject(SEARCH_RULE_PATCH.conditions!);
    expect(response).toHaveProperty("lastUpdatedAt");
    expect(response.lastUpdatedAt).toBeTypeOf("string");
    // Meilisearch date-time fields use RFC 3339 / ISO 8601 (OpenAPI format: date-time)
    expect(response.lastUpdatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    );
  });

  it("can delete a dynamic search rule", async () => {
    await adminClient
      .updateDynamicSearchRule(SEARCH_RULE_UID, SEARCH_RULE_PATCH)
      .waitTask();

    const task = await adminClient
      .deleteDynamicSearchRule(SEARCH_RULE_UID)
      .waitTask();

    expect(task).toHaveProperty("type", "dsrUpdate");
    expect(task).toHaveProperty("status", "succeeded");
  });

  it("enqueues delete for a missing rule without 404", async () => {
    const task = await adminClient
      .deleteDynamicSearchRule("missing-rule-uid-does-not-exist")
      .waitTask();

    expect(task).toHaveProperty("status", "succeeded");
  });

  it("can delete all dynamic search rules", async () => {
    await adminClient
      .updateDynamicSearchRule(SEARCH_RULE_UID, SEARCH_RULE_PATCH)
      .waitTask();

    const task = await adminClient.deleteAllDynamicSearchRules().waitTask();

    expect(task).toHaveProperty("type", "dsrClear");
    expect(task).toHaveProperty("status", "succeeded");

    const response = await adminClient.getDynamicSearchRules();
    expect(response.results).toHaveLength(0);
  });

  it("can create or update a dynamic search rule with a scale filter action", async () => {
    const payload: SearchRuleUpdatePayload = {
      actions: {
        scale: [{ filter: "series = batman", weight: 4.0 }],
      },
    };

    const task = await adminClient
      .updateDynamicSearchRule("batman-festival", payload)
      .waitTask();

    expect(task).toHaveProperty("type", "dsrUpdate");
    expect(task).toHaveProperty("status", "succeeded");

    const response = await adminClient.getDynamicSearchRule("batman-festival");
    expect(response).toHaveProperty("uid", "batman-festival");
    expect(response).toHaveProperty("actions", payload.actions);
  });

  it("can create or update a dynamic search rule with a scale ids action", async () => {
    const payload: SearchRuleUpdatePayload = {
      actions: {
        scale: [{ ids: ["1"], indexUid: "movies", weight: 0.0 }],
      },
    };

    const task = await adminClient
      .updateDynamicSearchRule("hide-movie", payload)
      .waitTask();

    expect(task).toHaveProperty("type", "dsrUpdate");
    expect(task).toHaveProperty("status", "succeeded");

    const response = await adminClient.getDynamicSearchRule("hide-movie");
    expect(response).toHaveProperty("uid", "hide-movie");
    expect(response).toHaveProperty("actions", payload.actions);
  });

  it("can create or update a dynamic search rule with a nested scale filter", async () => {
    const payload: SearchRuleUpdatePayload = {
      actions: {
        scale: [
          {
            filter: [["series = batman", "series = superman"], "year > 2000"],
            weight: 2.0,
          },
        ],
      },
    };

    const task = await adminClient
      .updateDynamicSearchRule("nested-scale-filter", payload)
      .waitTask();

    expect(task).toHaveProperty("type", "dsrUpdate");
    expect(task).toHaveProperty("status", "succeeded");

    const response = await adminClient.getDynamicSearchRule(
      "nested-scale-filter",
    );
    expect(response).toHaveProperty("uid", "nested-scale-filter");
    expect(response).toHaveProperty("actions", payload.actions);
  });
});
