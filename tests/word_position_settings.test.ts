import { afterAll, expect, test, describe, beforeEach } from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  Meilisearch,
  getClient,
  dataset,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on word position settings",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.index(index.uid).addDocuments(dataset).waitTask();
    });

    test(`${permission} key: Get wordPosition settings on empty index`, async () => {
      const client = await getClient(permission);

      const response = await client.index(index.uid).getWordPosition();
      expect(response).toMatchSnapshot();
    });

    test(`${permission} key: Set wordPosition settings with dedicated endpoint on empty index`, async () => {
      const client = await getClient(permission);

      await client
        .index(index.uid)
        .updateWordPosition({ enabled: false })
        .waitTask();

      const updatedSettings = await client.index(index.uid).getWordPosition();
      expect(updatedSettings).toEqual({ enabled: false });
    });

    test(`${permission} key: Reset wordPosition settings on an empty index`, async () => {
      const client = await getClient(permission);

      await client.index(index.uid).resetWordPosition().waitTask();

      const response = await client.index(index.uid).getWordPosition();
      expect(response).toMatchSnapshot();
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on word position settings",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get word position settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getWordPosition(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update word position settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateWordPosition({ enabled: false }),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset word position settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetWordPosition(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on word position settings",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get word position settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getWordPosition(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update word position settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateWordPosition({ enabled: false }),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset word position settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetWordPosition(),
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
  test(`getWordPosition route`, async () => {
    const route = `indexes/${index.uid}/settings/word-position`;
    const client = new Meilisearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getWordPosition(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateWordPosition route`, async () => {
    const route = `indexes/${index.uid}/settings/word-position`;
    const client = new Meilisearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateWordPosition({ enabled: false }),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetWordPosition route`, async () => {
    const route = `indexes/${index.uid}/settings/word-position`;
    const client = new Meilisearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetWordPosition(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
