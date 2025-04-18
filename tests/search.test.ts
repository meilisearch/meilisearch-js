import { afterAll, beforeAll, test, describe } from "vitest";
import { assert, HOST, MASTER_KEY } from "./utils/meilisearch-test-utils.js";
import { type Film, FILMS } from "./utils/test-data/films.js";
import type {
  ExplicitVectors,
  Federation,
  FilterExpression,
  MatchingStrategy,
  SearchHit,
  SearchQuery,
  SearchQueryWithIndexAndFederation,
  SearchResultWithOffsetLimit,
  SearchResultWithPagination,
} from "../src/index.js";
import {
  assertFacetDistributionAndStatsAreCorrect,
  client,
  federatedMultiSearch,
  index,
  INDEX_UID,
  multiSearch,
  search,
  searchGet,
  searchSimilarDocuments,
  searchSimilarDocumentsGet,
} from "./utils/search.js";

beforeAll(async () => {
  // TODO: If this disables the rest of the experimental features, that might be a problem, consider https://vitest.dev/config/#globalsetup
  await client.updateExperimentalFeatures({ network: true });
  await client.updateNetwork({
    self: INDEX_UID,
    remotes: { [INDEX_UID]: { url: HOST, searchApiKey: MASTER_KEY } },
  });

  await index
    .updateSettings({
      filterableAttributes: [
        "id",
        "genres",
        "popularity",
        "release_date",
        "_geo",
      ],
      sortableAttributes: ["popularity"],
      embedders: {
        default: {
          source: "userProvided",
          dimensions: 1,
        },
      },
    })
    .waitTask()
    .then(({ status, error }) => {
      assert.isNull(error);
      assert.strictEqual(status, "succeeded");
    });

  await index
    .addDocuments(FILMS)
    .waitTask()
    .then(({ status, error }) => {
      assert.isNull(error);
      assert.strictEqual(status, "succeeded");
    });
});

afterAll(async () => {
  await index
    .delete()
    .waitTask()
    .then(({ status, error }) => {
      assert.isNull(error);
      assert.strictEqual(status, "succeeded");
    });
  await client.updateNetwork({});
});

describe.concurrent("`q` param", () => {
  const params: SearchQuery = { q: "earth" };

  test.for([search, searchGet, multiSearch])(
    "with $name",
    async ({ searchMethod }) => {
      const { query, processingTimeMs, hits } = await searchMethod(params);

      assert.typeOf(processingTimeMs, "number");
      assert.strictEqual(query, params.q);
      assert.sameMembers(
        hits.map((v) => v.id),
        [95, 348, 607, 608],
      );
    },
  );

  // Does this affect the search result?
  test(`with ${index.searchForFacetValues.name}`, async () => {
    await assert.resolves(
      index.searchForFacetValues({ facetName: "popularity", ...params }),
    );
  });
});

describe.concurrent("`limit` and `offset` params", () => {
  const params = { limit: 1, offset: 1 };

  test.for([
    search,
    searchGet,
    multiSearch,
    federatedMultiSearch,
    searchSimilarDocuments,
    searchSimilarDocumentsGet,
  ])("with $name", async ({ searchMethod }) => {
    const { limit, offset, estimatedTotalHits } = (await searchMethod(
      params,
    )) as SearchResultWithOffsetLimit<Film>;

    assert.typeOf(estimatedTotalHits, "number");
    assert.deepEqual({ limit, offset }, params);
  });
});

describe.concurrent("pagination params", () => {
  const params = { page: 1, hitsPerPage: 1 };

  test.for([search, searchGet, multiSearch])(
    "with $name",
    async ({ searchMethod }) => {
      const { page, hitsPerPage, totalHits, totalPages } = (await searchMethod(
        params,
      )) as SearchResultWithPagination<Film>;

      assert.typeOf(totalHits, "number");
      assert.typeOf(totalPages, "number");
      assert.deepEqual({ page, hitsPerPage }, params);
    },
  );
});

describe.concurrent("params affecting only `hits` or `hit._formatted`", () => {
  const params: SearchQuery = {
    attributesToRetrieve: ["overview", "popularity"],
    attributesToSearchOn: ["overview"],
    attributesToCrop: ["overview"],
    cropLength: 1,
    cropMarker: "♥",
    attributesToHighlight: ["overview"],
    highlightPreTag: "☻",
    highlightPostTag: "☺",
    distinct: "popularity",
    sort: ["popularity:asc"],
    locales: ["eng"],
    // needed for some formatting to fully take effect
    q: "earth",
    // to limit number of results
    limit: 2,
  };

  test.for([search, searchGet, multiSearch, federatedMultiSearch])(
    "with $name",
    async ({ searchMethod }) => {
      const { hits } = await searchMethod(params);

      for (const hit of hits) {
        assert.lengthOf(Object.keys(hit), 3);
        assert.typeOf(hit.overview, "string");
        assert.typeOf(hit.popularity, "number");

        assert.isDefined(hit._formatted);
        assert.lengthOf(Object.keys(hit._formatted), 2);
        const { overview, popularity } = hit._formatted;

        assert.includeDeepMembers(
          [
            { overview: "♥☻Earth☺♥", popularity: "34.945" },
            { overview: "♥☻earth☺♥", popularity: "41.947" },
          ],
          [{ overview, popularity }],
        );
      }
    },
  );

  // Does this affect the search result?
  test(`with ${index.searchForFacetValues.name}`, async () => {
    const { attributesToSearchOn, locales } = params;

    await assert.resolves(
      index.searchForFacetValues({
        facetName: "popularity",
        attributesToSearchOn,
        locales,
      }),
    );
  });

  test.for([searchSimilarDocuments, searchSimilarDocumentsGet])(
    "with $name",
    async ({ searchMethod }) => {
      const { attributesToRetrieve } = params;

      const { hits } = await searchMethod({ attributesToRetrieve });

      for (const hit of hits) {
        assert.lengthOf(Object.keys(hit), 2);
        assert.typeOf(hit.overview, "string");
        assert.typeOf(hit.popularity, "number");
      }
    },
  );
});

describe.concurrent("`facets` param", () => {
  const params: SearchQuery = {
    facets: ["genres", "popularity"],
    // to limit number of results
    filter: "popularity < 17",
  };

  test.for([search, searchGet, multiSearch, federatedMultiSearch])(
    "with $name",
    async ({ searchMethod }) => {
      const { facetDistribution, facetStats } = await searchMethod(params);
      assertFacetDistributionAndStatsAreCorrect(facetDistribution, facetStats);
    },
  );
});

describe.concurrent("ranking score params", () => {
  const params = {
    showRankingScore: true,
    showRankingScoreDetails: true,
    rankingScoreThreshold: 0.5,
  };

  test.for([
    search,
    searchGet,
    multiSearch,
    federatedMultiSearch,
    searchSimilarDocuments,
    searchSimilarDocumentsGet,
  ])("with $name", async ({ searchMethod }) => {
    const { hits } = await searchMethod(params);

    for (const { _rankingScore, _rankingScoreDetails } of hits) {
      assert.typeOf(_rankingScore, "number");
      // TODO: This could be more thoroughly tested and typed
      assert.typeOf(_rankingScoreDetails, "object");
    }
  });

  // Does this affect the search result?
  test(`with ${index.searchForFacetValues.name}`, async () => {
    const { rankingScoreThreshold } = params;

    await assert.resolves(
      index.searchForFacetValues({
        facetName: "genres",
        rankingScoreThreshold,
      }),
    );
  });
});

describe.concurrent("`showMatchesPosition` param", () => {
  const params: SearchQuery = {
    showMatchesPosition: true,
    // required to get matches
    q: "apple",
    // to limit number of results
    limit: 1,
  };

  test.for([search, searchGet, multiSearch, federatedMultiSearch])(
    "with $name",
    async ({ searchMethod }) => {
      const { hits } = await searchMethod(params);

      assert.deepEqual(
        hits.map((hit) => hit._matchesPosition),
        [
          {
            "providers.buy.name": [{ indices: [0], length: 5, start: 0 }],
            "providers.rent.name": [{ indices: [0], length: 5, start: 0 }],
          },
        ],
      );
    },
  );
});

const possibleMatchingStrategies = Object.keys({
  last: null,
  all: null,
  frequency: null,
  // record because cannot convert union to tuple (https://github.com/microsoft/TypeScript/issues/42857)
} satisfies { [TKey in MatchingStrategy]: null }) as MatchingStrategy[];

describe.concurrent.for(possibleMatchingStrategies)(
  "`matchingStrategy` = `%s` param",
  (matchingStrategy) => {
    test.for([search, searchGet, multiSearch, federatedMultiSearch])(
      "with $name",
      async ({ searchMethod }) => {
        await assert.resolves(searchMethod({ matchingStrategy }));
      },
    );

    // Does this affect the search result?
    test(`with ${index.searchForFacetValues.name}`, async () => {
      await assert.resolves(
        index.searchForFacetValues({
          facetName: "genres",
          matchingStrategy,
        }),
      );
    });
  },
);

// TODO: Another filter with geo filtering
const filterExpressions: [name: string, filter: FilterExpression][] = [
  ["string", `release_date < ${Date.parse("1998-01-01")} AND id = 607`],
  ["array", [[`release_date < ${Date.parse("1998-01-01")}`], ["id = 607"]]],
];

describe.concurrent.for(filterExpressions)(
  "%s `filter` param",
  ([, filter]) => {
    test.for([search, searchGet, multiSearch, federatedMultiSearch])(
      "with $name",
      async ({ searchMethod }) => {
        const { hits } = await searchMethod({ filter });

        assert.deepEqual(
          hits.map((v) => v.id),
          [607],
        );
      },
    );

    test(`with ${index.searchForFacetValues.name}`, async () => {
      await assert.resolves(
        index.searchForFacetValues({
          facetName: "genres",
          filter,
        }),
      );
    });

    test.for([searchSimilarDocuments, searchSimilarDocumentsGet])(
      "with $name",
      async ({ searchMethod }) => {
        await assert.resolves(searchMethod({ filter }));
      },
    );
  },
);

describe.concurrent("`filter` param with geo", () => {
  const filter = "_geoRadius(45.472735, 9.184019, 2000)";

  test.for([search, searchGet, multiSearch, federatedMultiSearch])(
    "with $name",
    async ({ searchMethod }) => {
      const { hits } = await searchMethod({ filter });

      assert.sameMembers(
        hits.map((v) => v.id),
        [95, 97],
      );
    },
  );

  test(`with ${index.searchForFacetValues.name}`, async () => {
    await assert.resolves(
      index.searchForFacetValues({
        facetName: "genres",
        filter,
      }),
    );
  });

  test.for([searchSimilarDocuments, searchSimilarDocumentsGet])(
    "with $name",
    async ({ searchMethod }) => {
      await assert.resolves(searchMethod({ filter }));
    },
  );
});

test.concurrent(`${federatedMultiSearch.name} method`, async () => {
  const queries: SearchQueryWithIndexAndFederation[] = [
    {
      indexUid: INDEX_UID,
      q: "earth",
      federationOptions: {
        weight: 1,
        remote: INDEX_UID,
        queryPosition: 1,
      },
    },
  ];
  const federation: Federation = {
    facetsByIndex: { [INDEX_UID]: ["genres", "popularity"] },
  };

  const { hits, facetsByIndex, remoteErrors } =
    await client.federatedMultiSearch({
      queries,
      federation,
    });

  for (const {
    _federation: { weightedRankingScore, ..._federation },
  } of hits) {
    assert.typeOf(weightedRankingScore, "number");
    assert.deepEqual(_federation, {
      indexUid: INDEX_UID,
      queriesPosition: 1,
      remote: INDEX_UID,
    });
  }

  assert.sameMembers(Object.keys(facetsByIndex), [INDEX_UID]);
  const { distribution, stats } = facetsByIndex[INDEX_UID];
  assertFacetDistributionAndStatsAreCorrect(distribution, stats);

  // TODO: Maybe could get an error response for this, to validate it against
  assert.deepEqual(remoteErrors, {});

  const { facetDistribution, facetStats } = await client.federatedMultiSearch({
    queries,
    federation: { ...federation, mergeFacets: { maxValuesPerFacet: 100 } },
  });

  assert.deepEqual(facetDistribution, distribution);
  assert.deepEqual(facetStats, stats);
});

// TODO:
function assertSomething(hits: SearchHit<Film>[]) {
  for (const { _vectors } of hits) {
    assert.lengthOf(Object.keys(_vectors), 1);
    const {
      default: { embeddings, ...restOfObj },
    } = _vectors as Record<string, ExplicitVectors>;

    for (const embedding of embeddings) {
      assert(Array.isArray(embedding));
      for (const embeddingElement of embedding) {
        assert.typeOf(embeddingElement, "number");
      }
    }

    assert.deepEqual(restOfObj, { regenerate: false });
  }
}

describe.concurrent("embedding related params", () => {
  const params: SearchQuery = {
    q: "",
    vector: [1],
    hybrid: { semanticRatio: 1.0, embedder: "default" },
    retrieveVectors: true,
  };

  test.for([search, searchGet, multiSearch, federatedMultiSearch])(
    "with $name",
    async ({ searchMethod }) => {
      const { semanticHitCount, hits } = await searchMethod(params);

      assert.typeOf(semanticHitCount, "number");
      assertSomething(hits);
    },
  );

  test.for([searchSimilarDocuments, searchSimilarDocumentsGet])(
    "with $name",
    async ({ searchMethod }) => {
      const { retrieveVectors } = params;
      const { hits } = await searchMethod({ retrieveVectors });

      assertSomething(hits);
    },
  );
});

test.todo("abortable http request");
