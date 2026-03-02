import { expect, test, describe, beforeEach, assert } from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  MeiliSearch,
  BAD_HOST,
  getClient,
} from "./utils/meilisearch-test-utils.js";

beforeEach(async () => {
  await clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on compact should succeed with right permission",
  ({ permission }) => {
    test(`${permission} key: compact an index`, async () => {
      const client = await getClient(permission);
      await client.createIndex("movies").waitTask();
      const taskResult = await client.index("movies").compact().waitTask();

      assert.strictEqual(taskResult.status, "succeeded");
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on compact with search api key should not have access",
  ({ permission }) => {
    test(`${permission} key: try to compact index with search key and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.index("movies").compact()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_API_KEY,
      );
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on compact without api key should not have access",
  ({ permission }) => {
    test(`${permission} key: try to compact index with no key and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.index("movies").compact()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`compact route`, async () => {
    const route = `indexes/movies/compact`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;

    await expect(client.index("movies").compact()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
