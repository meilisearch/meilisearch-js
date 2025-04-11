import type { RecordAny } from "./shared.js";
import type { FieldDistribution } from "./types.js";

/** @see `milli::search::new::matches::MatchBounds` */
export type MatchBounds = { start: number; length: number; indices: number[] };

/** @see `meilisearch::search::MatchesPosition` */
export type MatchesPosition = Record<string, MatchBounds[]>;

/** @see `meilisearch::search::SearchHit` */
export type SearchHit<T extends RecordAny = RecordAny> = T & {
  _formatted?: T;
  _matchesPosition?: MatchesPosition;
  _rankingScore?: number;
  _rankingScoreDetails?: RecordAny;
};

/**
 * @remarks
 * This is an untyped structure in the source code.
 * @see `meilisearch::search::federated::perform::SearchByIndex::execute`
 */
export type FederationDetails = {
  indexUid: string;
  queriesPosition: number;
  weightedRankingScore: number;
};

export type FederatedSearchHit<T extends RecordAny = RecordAny> =
  SearchHit<T> & { _federation: FederationDetails };

/** @see `meilisearch::search::HitsInfo` */
type Pagination = {
  hitsPerPage: number;
  page: number;
  totalPages: number;
  totalHits: number;
};

/** @see `meilisearch::search::HitsInfo` */
type OffsetLimit = {
  limit: number;
  offset: number;
  estimatedTotalHits: number;
};

/** @see `meilisearch::search::FacetStats` */
export type FacetStats = {
  min: number;
  max: number;
};

type ProcessingTime = { processingTimeMs: number };

type SearchResultCore = {
  query: string;
  facetDistribution?: Record<string, FieldDistribution>;
  facetStats?: Record<string, FacetStats>;
  semanticHitCount?: number;
} & ProcessingTime;

export type SearchResultWithPagination<T extends RecordAny = RecordAny> =
  SearchResultCore & { hits: SearchHit<T>[] } & Pagination;
export type SearchResultWithOffsetLimit<T extends RecordAny = RecordAny> =
  SearchResultCore & { hits: SearchHit<T>[] } & OffsetLimit;

/** @see `meilisearch::search::SearchResult` */
export type SearchResult<T extends RecordAny = RecordAny> =
  | SearchResultWithOffsetLimit<T>
  | SearchResultWithPagination<T>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/multi_search#federated-multi-search-requests}
 *
 * @see `meilisearch::search::federated::types::FederatedSearchResult`
 */
export type FederatedSearchResult = SearchResultCore & {
  hits: FederatedSearchHit<Record<string, unknown>>[];
} & OffsetLimit;

type SearchResultIndex = { indexUid: string };

export type SearchResultWithIndexAndPagination<
  T extends RecordAny = RecordAny,
> = SearchResultIndex & SearchResultWithPagination<T>;
export type SearchResultWithIndexAndOffsetLimit<
  T extends RecordAny = RecordAny,
> = SearchResultIndex & SearchResultWithOffsetLimit<T>;

/** @see `meilisearch::search::SearchResultWithIndex` */
export type SearchResultWithIndex<T extends RecordAny = RecordAny> =
  | SearchResultWithIndexAndPagination<T>
  | SearchResultWithIndexAndOffsetLimit<T>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/multi_search#non-federated-multi-search-requests}
 *
 * @see `meilisearch::routes::multi_search::SearchResults`
 */
export type SearchResults = {
  results: SearchResultWithIndex<Record<string, unknown>>[];
};

export type SearchResultsOrFederatedSearchResult =
  | SearchResults
  | FederatedSearchResult;

/** @see `milli::search::facet::search::FacetValueHit` */
export type FacetValueHit = { value: string; count: number };

/**
 * {@link https://www.meilisearch.com/docs/reference/api/facet_search#response}
 *
 * @see `meilisearch::search::FacetSearchResult`
 */
export type FacetSearchResult = {
  facetHits: FacetValueHit[];
  facetQuery: string | null;
} & ProcessingTime;

/** @see `meilisearch::search::SimilarResult` */
export type SimilarResult = {
  hits: SearchHit[];
  id: string;
} & ProcessingTime &
  OffsetLimit;
