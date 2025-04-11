import type { NonNullKeys, PascalToCamelCase, RequiredKeys } from "./shared.js";
import type { Locale } from "./types.js";

/** @see `meilisearch::search::HybridQuery` */
export type HybridQuery = {
  semanticRatio?: number;
  embedder: string;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/search#matching-strategy}
 *
 * @see `meilisearch::search::MatchingStrategy`
 */
export type MatchingStrategy = PascalToCamelCase<"Last" | "All" | "Frequency">;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/multi_search#federationoptions}
 *
 * @see `meilisearch::search::federated::types::FederationOptions`
 */
export type FederationOptions = {
  weight?: number;
  /** @experimental */
  remote?: string | null;
  queryPosition?: number | null;
};

type OffsetLimit = {
  /** {@link https://www.meilisearch.com/docs/reference/api/search#offset} */
  offset?: number | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#limit} */
  limit?: number | null;
};

export type Pagination = {
  /** {@link https://www.meilisearch.com/docs/reference/api/search#page} */
  page?: number | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#number-of-results-per-page} */
  hitsPerPage?: number | null;
};

/** {@link https://www.meilisearch.com/docs/learn/filtering_and_sorting/filter_expression_reference} */
export type FilterExpression = string | (string | string[])[];

type FirstPartOfFacetAndSearchQuerySegment = {
  /** {@link https://www.meilisearch.com/docs/reference/api/search#filter} */
  filter?: FilterExpression | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#ranking-score-threshold} */
  rankingScoreThreshold?: number | null;
};

type FacetAndSearchQuerySegment = {
  /** {@link https://www.meilisearch.com/docs/reference/api/search#query-q} */
  q?: string | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#vector} */
  vector?: number[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#hybrid-search} */
  hybrid?: HybridQuery | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#matching-strategy} */
  matchingStrategy?: MatchingStrategy;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#customize-attributes-to-search-on-at-search-time} */
  attributesToSearchOn?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#query-locales} */
  locales?: Locale[] | null;
} & FirstPartOfFacetAndSearchQuerySegment;

type FirstPartOfSearchQueryCore = {
  /** {@link https://www.meilisearch.com/docs/reference/api/search#attributes-to-retrieve} */
  attributesToRetrieve?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#display-_vectors-in-response} */
  retrieveVectors?: boolean;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#ranking-score} */
  showRankingScore?: boolean;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#ranking-score-details} */
  showRankingScoreDetails?: boolean;
};

type SearchQueryCore = {
  /** {@link https://www.meilisearch.com/docs/reference/api/search#attributes-to-crop} */
  attributesToCrop?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#crop-length} */
  cropLength?: number;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#attributes-to-highlight} */
  attributesToHighlight?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#show-matches-position} */
  showMatchesPosition?: boolean;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#sort} */
  sort?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#distinct-attributes-at-search-time} */
  distinct?: string | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#facets} */
  facets?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#highlight-tags} */
  highlightPreTag?: string;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#highlight-tags} */
  highlightPostTag?: string;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#crop-marker} */
  cropMarker?: string;
} & FacetAndSearchQuerySegment &
  FirstPartOfSearchQueryCore;

export type SearchQueryWithOffsetLimit = SearchQueryCore & OffsetLimit;
type SearchQueryWithPagination = SearchQueryCore & Pagination;

/**
 * @remarks
 * While `page` is an `Option<usize>` with a default value of `None` in the
 * source code in `meilisearch::search::SearchQuery` (which serializes to
 * `number | null | undefined`), we're enforcing it in this case to guarantee a
 * response shape with pagination.
 */
export type SearchQueryWithRequiredPagination = RequiredKeys<
  SearchQueryWithPagination,
  "page"
>;

// export type RequiredPagination = RequiredKeys<Pagination, "page">;

/** @see `meilisearch::search::SearchQuery` */
export type SearchQuery =
  | SearchQueryWithOffsetLimit
  | SearchQueryWithPagination;

type SearchQueryWithIndexCore = SearchQueryCore & { indexUid: string };

export type SearchQueryWithIndexAndFederation = {
  /** {@link https://www.meilisearch.com/docs/reference/api/multi_search#federationoptions} */
  federationOptions?: FederationOptions | null;
} & SearchQueryWithIndexCore;

export type SearchQueryWithIndexAndOffsetLimit = SearchQueryWithIndexCore &
  OffsetLimit;
export type SearchQueryWithIndexAndPagination = SearchQueryWithIndexCore &
  Pagination;

/** @see `meilisearch::search::SearchQueryWithIndex` */
export type SearchQueryWithIndex =
  | SearchQueryWithIndexAndOffsetLimit
  | SearchQueryWithIndexAndPagination;

/** @see `meilisearch::search::federated::types::MergeFacets` */
export type MergeFacets = { maxValuesPerFacet?: number | null };

/** @see `meilisearch::search::federated::types::Federation` */
export type Federation = {
  limit?: number;
  offset?: number;
  facetsByIndex?: Record<string, string[] | null>;
  mergeFacets?: MergeFacets | null;
};

/** @see `meilisearch::search::federated::types::FederatedSearch` */
export type FederatedSearch = {
  queries: SearchQueryWithIndexAndFederation[];
  federation?: Federation | null;
};

/** @see `meilisearch::search::federated::types::FederatedSearch` */
export type MultiSearch = { queries: SearchQueryWithIndex[] };

export type MultiSearchOrFederatedSearch = MultiSearch | FederatedSearch;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/facet_search#body}
 *
 * @see `meilisearch::routes::indexes::facet_search::FacetSearchQuery`
 */
export type FacetSearchQuery = {
  facetQuery?: string | null;
  facetName: string;
  /**
   * @remarks
   * Undocumented.
   */
  exhaustiveFacetCount?: boolean | null;
} & FacetAndSearchQuerySegment;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/similar#body}
 *
 * @see `meilisearch::search::SimilarQuery`
 */
export type SimilarQuery = {
  id: string | number;
  /** {@link https://www.meilisearch.com/docs/reference/api/search#hybrid-search} */
  embedder: string;
} & FirstPartOfFacetAndSearchQuerySegment &
  FirstPartOfSearchQueryCore &
  NonNullKeys<OffsetLimit>;
