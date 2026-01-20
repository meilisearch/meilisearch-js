import { expect, test, describe, beforeEach, afterAll } from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "fields_test_index",
  primaryKey: "id",
};

const fieldsDataset = [
  { id: 1, title: "Alpha", genre: "sci-fi" },
  { id: 2, title: "Bravo", genre: "fantasy" },
];

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on fields endpoint",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client
        .createIndex(index.uid, { primaryKey: index.primaryKey })
        .waitTask();
      await client.index(index.uid).addDocuments(fieldsDataset).waitTask();
      await client
        .index(index.uid)
        .updateSettings({
          searchableAttributes: ["title"],
          displayedAttributes: ["title", "genre"],
          sortableAttributes: ["genre"],
          rankingRules: [
            "genre:asc",
            "words",
            "typo",
            "proximity",
            "attribute",
            "sort",
            "exactness",
          ],
          filterableAttributes: [
            {
              attributePatterns: ["genre"],
              features: {
                facetSearch: true,
                filter: { equality: true, comparison: true },
              },
            },
          ],
          faceting: { sortFacetValuesBy: { genre: "alpha" } },
          facetSearch: true,
          localizedAttributes: [
            { attributePatterns: ["title"], locales: ["eng", "fra"] },
          ],
        })
        .waitTask();
    });

    test(`${permission} key: Get fields with basic pagination`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFields({
        offset: 0,
        limit: 10,
      });

      expect(response).toHaveProperty("results");
      expect(response).toHaveProperty("offset", 0);
      expect(response).toHaveProperty("limit", 10);
      expect(response).toHaveProperty("total");
      expect(Array.isArray(response.results)).toBe(true);

      const byName = Object.fromEntries(
        response.results.map((field) => [field.name, field]),
      );

      const title = byName.title;
      const genre = byName.genre;
      expect(title).toBeDefined();
      expect(genre).toBeDefined();

      expect(title?.searchable?.enabled).toBe(true);
      expect(title?.displayed?.enabled).toBe(true);
      expect(title?.localized?.locales).toEqual(["eng", "fra"]);

      expect(genre?.searchable?.enabled ?? false).toBe(false);
      expect(genre?.displayed?.enabled).toBe(true);
      expect(genre?.sortable?.enabled).toBe(true);
      expect(genre?.rankingRule?.enabled).toBe(true);
      expect(genre?.rankingRule?.order).toBe("asc");
      expect(genre?.filterable?.enabled).toBe(true);
      expect(genre?.filterable?.sortBy).toBe("alpha");
      expect(genre?.filterable?.facetSearch).toBe(true);
      expect(genre?.filterable?.equality).toBe(true);
      expect(genre?.filterable?.comparison).toBe(true);
    });

    test(`${permission} key: Get fields with offset`, async () => {
      const client = await getClient(permission);
      const all = await client.index(index.uid).getFields();
      const response1 = await client.index(index.uid).getFields({
        offset: 0,
        limit: 1,
      });
      const response2 = await client.index(index.uid).getFields({
        offset: 1,
        limit: 1,
      });

      expect(response1.offset).toBe(0);
      expect(response2.offset).toBe(1);

      const allNames = new Set(all.results.map((field) => field.name));
      expect(allNames.has(response1.results[0].name)).toBe(true);
      expect(allNames.has(response2.results[0].name)).toBe(true);
      expect(response1.results[0].name).not.toBe(response2.results[0].name);
    });

    test(`${permission} key: Get fields with filter - displayed`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFields({
        filter: {
          displayed: true,
        },
      });

      expect(response).toHaveProperty("results");
      expect(Array.isArray(response.results)).toBe(true);

      const names = response.results.map((field) => field.name);
      expect(names).toEqual(expect.arrayContaining(["title", "genre"]));
      for (const field of response.results) {
        expect(field.displayed?.enabled).toBe(true);
      }
    });

    test(`${permission} key: Get fields with filter - searchable`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFields({
        filter: {
          searchable: true,
        },
      });

      expect(response).toHaveProperty("results");
      expect(Array.isArray(response.results)).toBe(true);

      const names = response.results.map((field) => field.name);
      expect(names).toEqual(["title"]);
      expect(response.results[0].searchable?.enabled).toBe(true);
    });

    test(`${permission} key: Get fields with filter - attribute patterns`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFields({
        filter: {
          attributePatterns: ["*"],
        },
      });

      expect(response).toHaveProperty("results");
      expect(Array.isArray(response.results)).toBe(true);

      const names = response.results.map((field) => field.name);
      expect(names).toEqual(expect.arrayContaining(["genre"]));
      for (const field of response.results) {
        expect(field.filterable?.enabled).toBe(true);
        expect(field.sortable?.enabled).toBe(true);
      }
    });

    test(`${permission} key: Get fields with multiple filters combined`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFields({
        offset: 0,
        limit: 5,
        filter: {
          searchable: true,
          displayed: true,
        },
      });

      expect(response).toHaveProperty("results");
      expect(response).toHaveProperty("offset", 0);
      expect(response).toHaveProperty("limit", 5);
      expect(Array.isArray(response.results)).toBe(true);

      const names = response.results.map((field) => field.name);
      expect(names).toEqual(expect.arrayContaining(["title", "genre"]));
      for (const field of response.results) {
        expect(field.displayed?.enabled).toBe(true);
        expect(field.searchable?.enabled ?? false).toBe(field.name === "title");
      }
    });

    test(`${permission} key: Get fields without parameters`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFields();

      expect(response).toHaveProperty("results");
      expect(response).toHaveProperty("offset");
      expect(response).toHaveProperty("limit");
      expect(response).toHaveProperty("total");
      expect(Array.isArray(response.results)).toBe(true);

      const names = response.results.map((field) => field.name);
      expect(names).toEqual(expect.arrayContaining(["title", "genre", "id"]));
    });

    test(`${permission} key: Field response structure validation`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFields({
        limit: 100,
      });

      const byName = Object.fromEntries(
        response.results.map((field) => [field.name, field]),
      );

      const titleField = byName.title;
      const genreField = byName.genre;
      expect(titleField).toBeDefined();
      expect(genreField).toBeDefined();

      expect(titleField?.searchable?.enabled).toBe(true);
      expect(titleField?.displayed?.enabled).toBe(true);
      expect(titleField?.localized?.locales).toEqual(["eng", "fra"]);

      expect(genreField?.displayed?.enabled).toBe(true);
      expect(genreField?.searchable?.enabled ?? false).toBe(false);
      expect(genreField?.sortable?.enabled).toBe(true);
      expect(genreField?.rankingRule?.order).toBe("asc");
      expect(genreField?.filterable?.sortBy).toBe("alpha");
      expect(genreField?.filterable?.facetSearch).toBe(true);
      expect(genreField?.filterable?.equality).toBe(true);
      expect(genreField?.filterable?.comparison).toBe(true);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on fields endpoint with restricted permissions",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await clearAllIndexes(config);
      await client
        .createIndex(index.uid, { primaryKey: index.primaryKey })
        .waitTask();
    });

    test(`${permission} key: try to get fields and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.index(index.uid).getFields()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_API_KEY,
      );
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on fields endpoint without authentication",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await clearAllIndexes(config);
      await client
        .createIndex(index.uid, { primaryKey: index.primaryKey })
        .waitTask();
    });

    test(`${permission} key: try to get fields and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.index(index.uid).getFields()).rejects.toHaveProperty(
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
])("Tests on url construction for fields endpoint", ({ host, trailing }) => {
  test(`getFields route construction`, async () => {
    const route = `indexes/${index.uid}/fields`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).getFields()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
