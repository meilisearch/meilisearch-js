import type { RecordAny, DeepStringRecord } from "./shared.js";
import type { FieldDistribution, MeiliSearchErrorResponse } from "./types.js";

// TODO: Maybe more links

/** @see `milli::search::new::matches::MatchBounds` */
export type MatchBounds = { start: number; length: number; indices?: number[] };

/** @see `meilisearch::search::MatchesPosition` */
export type MatchesPosition = Record<string, MatchBounds[]>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/search#ranking-score-details-object}
 *
 * @privateRemarks
 * This could be typed more accurately, but both the source code and
 * documentation is a little confusing.
 * @see `milli::score_details::ScoreDetails::to_json_map`
 */
export type ScoreDetails = RecordAny;

/** @see `milli::vector::parsed_vectors::ExplicitVectors` */
export type ExplicitVectors = {
  embeddings: number[] | number[][];
  regenerate: boolean;
};

/** @see `meilisearch::search::SearchHit` */
export type SearchHit<T extends RecordAny = RecordAny> = T & {
  _formatted?: DeepStringRecord<T>;
  _matchesPosition?: MatchesPosition;
  _rankingScore?: number;
  _rankingScoreDetails?: ScoreDetails;
  /** @see `meilisearch::search::insert_geo_distance` */
  _geoDistance?: number;
  /** @see `meilisearch::search::HitMaker::make_hit` */
  _vectors?: Record<string, ExplicitVectors>;
};

/**
 * @privateRemarks
 * This is an untyped structure in the source code.
 * @see `meilisearch::search::federated::perform::SearchByIndex::execute`
 */
export type FederationDetails = {
  indexUid: string;
  queriesPosition: number;
  remote?: string;
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
  // TODO: this is not present on federated result
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

/** @see `meilisearch::search::ComputedFacets` */
export type ComputedFacets = {
  distribution: Record<string, Record<string, number>>;
  stats: Record<string, FacetStats>;
};

/** @see `meilisearch::search::federated::types::FederatedFacets` */
export type FederatedFacets = Record<string, ComputedFacets>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/multi_search#federated-multi-search-requests}
 *
 * @see `meilisearch::search::federated::types::FederatedSearchResult`
 */
export type FederatedSearchResult = SearchResultCore & {
  hits: FederatedSearchHit<Record<string, unknown>>[];
  facetsByIndex: FederatedFacets;
  remoteErrors?: Record<string, MeiliSearchErrorResponse>;
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

/** {@link https://www.meilisearch.com/docs/reference/api/multi_search#response} */
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
