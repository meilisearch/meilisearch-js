import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { ErrorStatusCode, type ForeignKeys } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  Meilisearch,
  getClient,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "books",
};
const relatedIndex = {
  uid: "authors",
};

const DEFAULT_FOREIGN_KEYS: ForeignKeys = [];
const NEW_FOREIGN_KEYS: ForeignKeys = [
  {
    foreignIndexUid: relatedIndex.uid,
    fieldName: "author",
  },
  {
    foreignIndexUid: relatedIndex.uid,
    fieldName: "related_authors",
  },
];

beforeAll(async () => {
  const client = await getClient("Master");
  await client.updateExperimentalFeatures({ foreignKeys: true });
});

afterAll(async () => {
  const client = await getClient("Master");
  await client.updateExperimentalFeatures({ foreignKeys: false });
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on foreignKeys",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
      await client.createIndex(relatedIndex.uid).waitTask();
    });

    test(`${permission} key: Get default foreignKeys settings`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getForeignKeys();

      expect(response).toEqual(DEFAULT_FOREIGN_KEYS);
    });

    test(`${permission} key: Update foreignKeys`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .updateForeignKeys(NEW_FOREIGN_KEYS)
        .waitTask();

      const response = await client.index(index.uid).getForeignKeys();

      expect(response).toEqual(NEW_FOREIGN_KEYS);
    });

    test(`${permission} key: Update foreignKeys through settings`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .updateSettings({ foreignKeys: NEW_FOREIGN_KEYS })
        .waitTask();

      const response = await client.index(index.uid).getSettings();

      expect(response.foreignKeys).toEqual(NEW_FOREIGN_KEYS);
    });

    test(`${permission} key: Update foreignKeys with null value`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).updateForeignKeys(null).waitTask();

      const response = await client.index(index.uid).getForeignKeys();

      expect(response).toEqual(DEFAULT_FOREIGN_KEYS);
    });

    test(`${permission} key: Reset foreignKeys`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .updateForeignKeys(NEW_FOREIGN_KEYS)
        .waitTask();
      await client.index(index.uid).resetForeignKeys().waitTask();

      const response = await client.index(index.uid).getForeignKeys();

      expect(response).toEqual(DEFAULT_FOREIGN_KEYS);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on foreignKeys",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get foreignKeys and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getForeignKeys(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update foreignKeys and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateForeignKeys([]),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset foreignKeys and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetForeignKeys(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on foreignKeys",
  ({ permission }) => {
    beforeAll(async () => {
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get foreignKeys and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getForeignKeys(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update foreignKeys and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateForeignKeys([]),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset foreignKeys and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetForeignKeys(),
      ).rejects.toHaveProperty(
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
  test(`getForeignKeys route`, async () => {
    const route = `indexes/${index.uid}/settings/foreign-keys`;
    const client = new Meilisearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getForeignKeys(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateForeignKeys route`, async () => {
    const route = `indexes/${index.uid}/settings/foreign-keys`;
    const client = new Meilisearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateForeignKeys([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetForeignKeys route`, async () => {
    const route = `indexes/${index.uid}/settings/foreign-keys`;
    const client = new Meilisearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetForeignKeys(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
