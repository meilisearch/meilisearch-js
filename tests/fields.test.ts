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
      const fields = await client.index(index.uid).getFields({
        offset: 0,
        limit: 10,
      });

      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      const byName = Object.fromEntries(
        fields.map((field) => [field.name, field]),
      );

      const title = byName.title;
      const genre = byName.genre;
      expect(title).toBeDefined();
      expect(genre).toBeDefined();

      // Verify field structure includes all capability objects
      expect(title).toHaveProperty("displayed");
      expect(title).toHaveProperty("searchable");
      expect(title).toHaveProperty("sortable");
      expect(title).toHaveProperty("distinct");
      expect(title).toHaveProperty("rankingRule");
      expect(title).toHaveProperty("filterable");
      expect(title).toHaveProperty("localized");

      expect(genre).toHaveProperty("displayed");
      expect(genre).toHaveProperty("searchable");
    });

    test(`${permission} key: Get fields with offset`, async () => {
      const client = await getClient(permission);
      const all = await client.index(index.uid).getFields();
      const page1 = await client.index(index.uid).getFields({
        offset: 0,
        limit: 1,
      });
      const page2 = await client.index(index.uid).getFields({
        offset: 1,
        limit: 1,
      });

      // Pagination returns correct array sizes
      expect(page1.length).toBe(1);
      expect(page2.length).toBe(1);

      // Fields in pages are from the full set
      const allNames = new Set(all.map((field) => field.name));
      expect(allNames.has(page1[0].name)).toBe(true);
      expect(allNames.has(page2[0].name)).toBe(true);

      // Different offsets return different fields
      expect(page1[0].name).not.toBe(page2[0].name);
    });

    test(`${permission} key: Get fields with filter - displayed`, async () => {
      const client = await getClient(permission);
      const fields = await client.index(index.uid).getFields({
        filter: {
          displayed: true,
        },
      });

      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Verify all returned fields have displayed enabled
      for (const field of fields) {
        expect(field.displayed?.enabled).toBe(true);
      }
    });

    test(`${permission} key: Get fields with filter - searchable`, async () => {
      const client = await getClient(permission);
      const fields = await client.index(index.uid).getFields({
        filter: {
          searchable: true,
        },
      });

      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);

      // Verify all returned fields have searchable enabled
      for (const field of fields) {
        expect(field.searchable?.enabled).toBe(true);
      }
    });

    test(`${permission} key: Get fields with filter - attribute patterns`, async () => {
      const client = await getClient(permission);
      const fields = await client.index(index.uid).getFields({
        filter: {
          attributePatterns: ["tit*"],
        },
      });

      expect(Array.isArray(fields)).toBe(true);

      const names = fields.map((field) => field.name);
      // attributePatterns filters by name pattern
      expect(names).toEqual(["title"]);
    });

    test(`${permission} key: Get fields with multiple filters combined`, async () => {
      const client = await getClient(permission);
      const fields = await client.index(index.uid).getFields({
        offset: 0,
        limit: 5,
        filter: {
          searchable: true,
          displayed: true,
        },
      });

      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeLessThanOrEqual(5);

      // Verify all returned fields match the combined filters
      for (const field of fields) {
        expect(field.displayed?.enabled).toBe(true);
        expect(field.searchable?.enabled).toBe(true);
      }
    });

    test(`${permission} key: Get fields without parameters`, async () => {
      const client = await getClient(permission);
      const fields = await client.index(index.uid).getFields();

      expect(Array.isArray(fields)).toBe(true);

      const names = fields.map((field) => field.name);
      expect(names).toEqual(expect.arrayContaining(["title", "genre", "id"]));
    });

    test(`${permission} key: Field response structure validation`, async () => {
      const client = await getClient(permission);
      const fields = await client.index(index.uid).getFields({
        limit: 100,
      });

      const byName = Object.fromEntries(
        fields.map((field) => [field.name, field]),
      );

      const titleField = byName.title;
      const genreField = byName.genre;
      expect(titleField).toBeDefined();
      expect(genreField).toBeDefined();

      // Verify each field has all capability sub-objects
      expect(titleField).toHaveProperty("name");
      expect(titleField).toHaveProperty("displayed");
      expect(titleField).toHaveProperty("searchable");
      expect(titleField).toHaveProperty("sortable");
      expect(titleField).toHaveProperty("distinct");
      expect(titleField).toHaveProperty("rankingRule");
      expect(titleField).toHaveProperty("filterable");
      expect(titleField).toHaveProperty("localized");

      // Verify capability objects have the correct structure
      expect(titleField.displayed).toHaveProperty("enabled");
      expect(typeof titleField.displayed?.enabled).toBe("boolean");
      expect(titleField.searchable).toHaveProperty("enabled");
      expect(typeof titleField.searchable?.enabled).toBe("boolean");
      expect(titleField.filterable).toHaveProperty("enabled");
      expect(titleField.filterable).toHaveProperty("sortBy");
      expect(titleField.filterable).toHaveProperty("facetSearch");
      expect(titleField.filterable).toHaveProperty("equality");
      expect(titleField.filterable).toHaveProperty("comparison");
      expect(titleField.localized).toHaveProperty("locales");
      expect(Array.isArray(titleField.localized?.locales)).toBe(true);
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
