import {
  afterAll,
  expect,
  test,
  describe,
  beforeEach,
  expectTypeOf,
} from "vitest";
import {
  ErrorStatusCode,
  type ChatSettings,
  type SearchParams,
} from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  getClient,
  dataset,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "chat_settings_test",
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on chat settings",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.index(index.uid).addDocuments(dataset).waitTask();
    });

    test(`${permission} key: Get an index chat settings`, async () => {
      const client = await getClient(permission);

      const response = await client.index(index.uid).getChat();
      expect(response).toHaveProperty("description");
      expect(response).toHaveProperty("documentTemplate");
      expect(response).toHaveProperty("documentTemplateMaxBytes");
      expect(response).toHaveProperty("searchParameters");
      expectTypeOf(response.searchParameters).toEqualTypeOf<SearchParams>();
    });

    test(`${permission} key: Update chat settings with all properties`, async () => {
      const client = await getClient(permission);
      const newChatSettings = {
        description:
          "A comprehensive movie database containing titles, overviews, genres, and release dates to help users find movies",
        documentTemplate:
          "Title: {{ title }}\nDescription: {{ overview }}\nGenres: {{ genres }}\nRelease Date: {{ release_date }}\n",
        documentTemplateMaxBytes: 500,
        searchParameters: {
          hybrid: { embedder: "default" },
          limit: 20,
          sort: ["release_date:desc"],
          distinct: "title",
          matchingStrategy: "last",
          attributesToSearchOn: ["title", "overview"],
          rankingScoreThreshold: 0.5,
        },
      } satisfies ChatSettings;

      await client.index(index.uid).updateChat(newChatSettings).waitTask();

      const response = await client.index(index.uid).getChat();
      expect(response).toMatchObject(newChatSettings);
    });
  },
);

describe.each([
  { permission: "Search", errorCode: ErrorStatusCode.INVALID_API_KEY },
  { permission: "No", errorCode: ErrorStatusCode.MISSING_AUTHORIZATION_HEADER },
])("Test on chat settings", ({ permission, errorCode }) => {
  beforeEach(async () => {
    await clearAllIndexes(config);
    const client = await getClient("Master");
    await client.createIndex(index.uid).waitTask();
  });

  test(`${permission} key: try to get chat settings and be denied`, async () => {
    const client = await getClient(permission);
    await expect(client.index(index.uid).getChat()).rejects.toHaveProperty(
      "cause.code",
      errorCode,
    );
  });

  test(`${permission} key: try to update chat settings and be denied`, async () => {
    const client = await getClient(permission);
    await expect(
      client.index(index.uid).updateChat({ description: "test" }),
    ).rejects.toHaveProperty("cause.code", errorCode);
  });
});
