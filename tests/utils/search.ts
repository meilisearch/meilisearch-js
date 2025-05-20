import { randomUUID } from "node:crypto";
import { assert, getClient } from "./meilisearch-test-utils.js";
import type { Film } from "./test-data/films.js";
import type {
  FacetStats,
  MeiliSearch,
  SearchHit,
  SearchQuery,
  SearchQueryWithOffsetLimit,
  SearchResult,
} from "../../src/index.js";

export const INDEX_UID = randomUUID();
export const client = await getClient("Master");
export const index = client.index<Film>(INDEX_UID);

export const [
  search,
  searchGet,
  multiSearch,
  federatedMultiSearch,
  searchSimilarDocuments,
  searchSimilarDocumentsGet,
] = [
  { name: index.search.name, searchMethod: index.search.bind(index) },
  {
    name: index.searchGet.name,
    searchMethod: (searchQuery) => {
      const { hybrid, ...rest } = searchQuery ?? {};

      return index.searchGet(
        hybrid == null
          ? searchQuery
          : {
              ...rest,
              hybridSemanticRatio: hybrid.semanticRatio,
              hybridEmbedder: hybrid.embedder,
            },
      );
    },
  },
  {
    name: "multiSearch" satisfies keyof Pick<MeiliSearch, "multiSearch">,
    searchMethod: async (searchQuery) => {
      const { results } = await client.multiSearch({
        queries: [{ indexUid: INDEX_UID, ...searchQuery }],
      });

      assert.lengthOf(results, 1);
      const [{ indexUid, hits, ...result }] = results;
      assert.strictEqual(indexUid, INDEX_UID);

      return { ...result, hits: hits as SearchHit<Film>[] };
    },
  },
  {
    name: "federatedMultiSearch" satisfies `federated${Capitalize<
      keyof Pick<MeiliSearch, "multiSearch">
    >}`,
    searchMethod: async (searchQuery) => {
      const { offset, limit, facets, ...restOfSearchQuery } = (searchQuery ??
        {}) as SearchQueryWithOffsetLimit;

      const { hits, ...result } = await client.multiSearch({
        queries: [{ indexUid: INDEX_UID, ...restOfSearchQuery }],
        federation: {
          offset: offset ?? undefined,
          limit: limit ?? undefined,
          facetsByIndex: { [INDEX_UID]: facets ?? null },
          mergeFacets: {},
        },
      });

      return {
        ...result,
        query: searchQuery?.q ?? "",
        hits: hits.map(({ _federation, ...hit }) => hit as SearchHit<Film>),
      };
    },
  },
  {
    name: index.searchSimilarDocuments.name,
    searchMethod: async ({
      offset,
      limit,
      ...searchQuery
    }: SearchQueryWithOffsetLimit = {}) => {
      const { hits, ...result } = await index.searchSimilarDocuments({
        id: 607,
        embedder: "default",
        offset: offset ?? undefined,
        limit: limit ?? undefined,
        ...searchQuery,
      });

      return {
        ...result,
        query: searchQuery.q ?? "",
        hits: hits as SearchHit<Film>[],
      };
    },
  },
  {
    name: index.searchSimilarDocumentsGet.name,
    searchMethod: async ({
      offset,
      limit,
      ...searchQuery
    }: SearchQueryWithOffsetLimit = {}) => {
      const { hits, ...result } = await index.searchSimilarDocumentsGet({
        id: 607,
        embedder: "default",
        offset: offset ?? undefined,
        limit: limit ?? undefined,
        ...searchQuery,
      });

      return {
        ...result,
        query: searchQuery.q ?? "",
        hits: hits as SearchHit<Film>[],
      };
    },
  },
] as const satisfies {
  name: string;
  searchMethod: (searchQuery?: SearchQuery) => Promise<SearchResult<Film>>;
}[];

export function assertFacetDistributionAndStatsAreCorrect(
  distribution?: Record<string, Record<string, number>>,
  stats?: Record<string, FacetStats>,
) {
  assert.isDefined(distribution);
  for (const indDist of Object.values(distribution)) {
    for (const val of Object.values(indDist)) {
      assert.typeOf(val, "number");
    }
  }

  assert.isDefined(stats);
  for (const val of Object.values(stats)) {
    assert.sameMembers(Object.keys(val), ["min", "max"]);
    const { min, max } = val;
    assert.typeOf(min, "number");
    assert.typeOf(max, "number");
  }
}
