import { expect, test, describe, beforeEach, assert } from "vitest";
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
  "Test on dump should succeed with right permission",
  ({ permission }) => {
    test(`${permission} key: create a new dump`, async () => {
      const client = await getClient(permission);
      const taskResult = await client.createDump().waitTask();

      assert.strictEqual(taskResult.status, "succeeded");
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on dump with search api key should not have access",
  ({ permission }) => {
    test(`${permission} key: try to create dump with search key and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.createDump()).rejects.toHaveProperty(
        "cause.code",
        "invalid_api_key",
      );
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on dump without api key should not have access",
  ({ permission }) => {
    test(`${permission} key: try to create dump with no key and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.createDump()).rejects.toHaveProperty(
        "cause.code",
        "missing_authorization_header",
      );
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`createDump route`, async () => {
    const route = `dumps`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;

    await expect(client.createDump()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
