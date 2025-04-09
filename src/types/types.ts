// Type definitions for meilisearch
// Project: https://github.com/meilisearch/meilisearch-js
// Definitions by: qdequele <quentin@meilisearch.com> <https://github.com/meilisearch>
// Definitions: https://github.com/meilisearch/meilisearch-js
// TypeScript Version: ^5.8.2

import type { WaitOptions } from "./task_and_batch.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RecordAny = Record<string, any>;

/**
 * Shape of allowed record object that can be appended to a
 * {@link URLSearchParams}.
 */
export type URLSearchParamsRecord = Record<
  string,
  | string
  | string[]
  | (string | string[])[]
  | number
  | number[]
  | boolean
  | Date
  | null
  | undefined
>;

/**
 * {@link RequestInit} without {@link RequestInit.body} and
 * {@link RequestInit.method} properties.
 */
export type ExtraRequestInit = Omit<RequestInit, "body" | "method">;

/** Same as {@link ExtraRequestInit} but without {@link ExtraRequestInit.signal}. */
export type BaseRequestInit = Omit<ExtraRequestInit, "signal">;

/**
 * Same as {@link BaseRequestInit} but with its headers property forced as a
 * {@link Headers} object.
 */
export type HttpRequestsRequestInit = Omit<BaseRequestInit, "headers"> & {
  headers: Headers;
};

/** Main configuration object for the meilisearch client. */
export type Config = {
  /**
   * The base URL for reaching a meilisearch instance.
   *
   * @remarks
   * Protocol and trailing slash can be omitted.
   */
  host: string;
  /**
   * API key for interacting with a meilisearch instance.
   *
   * @see {@link https://www.meilisearch.com/docs/learn/security/basic_security}
   */
  apiKey?: string;
  /**
   * Custom strings that will be concatted to the "X-Meilisearch-Client" header
   * on each request.
   */
  clientAgents?: string[];
  /** Base request options that may override the default ones. */
  requestInit?: BaseRequestInit;
  /**
   * Custom function that can be provided in place of {@link fetch}.
   *
   * @remarks
   * API response errors will have to be handled manually with this as well.
   * @deprecated This will be removed in a future version. See
   *   {@link https://github.com/meilisearch/meilisearch-js/issues/1824 | issue}.
   */
  httpClient?: (...args: Parameters<typeof fetch>) => Promise<unknown>;
  /** Timeout in milliseconds for each HTTP request. */
  timeout?: number;
  defaultWaitOptions?: WaitOptions;
};

/** Main options of a request. */
export type MainRequestOptions = {
  /** The path or subpath of the URL to make a request to. */
  path: string;
  /** The REST method of the request. */
  method?: string;
  /** The search parameters of the URL. */
  params?: URLSearchParamsRecord;
  /**
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type | Content-Type}
   * passed to request {@link Headers}.
   */
  contentType?: string;
  /**
   * The body of the request.
   *
   * @remarks
   * This only really supports string for now (any other type gets stringified)
   * but it could support more in the future.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#body}
   */
  body?: string | boolean | number | object | null;
  /**
   * An extra, more limited {@link RequestInit}, that may override some of the
   * options.
   */
  extraRequestInit?: ExtraRequestInit;
};

/**
 * {@link MainRequestOptions} without {@link MainRequestOptions.method}, for
 * method functions.
 */
export type RequestOptions = Omit<MainRequestOptions, "method">;

///
/// Resources
///

export type Pagination = {
  offset?: number;
  limit?: number;
};

export type ResourceQuery = Pagination & {};

export type ResourceResults<T> = Pagination & {
  results: T;
  total: number;
};

///
/// Indexes
///

export type IndexOptions = {
  primaryKey?: string;
};

export type IndexObject = {
  uid: string;
  primaryKey?: string;
  createdAt: string;
  updatedAt: string;
};

export type IndexesQuery = ResourceQuery & {};

export type IndexesResults<T> = ResourceResults<T> & {};

/*
 * SEARCH PARAMETERS
 */

export const MatchingStrategies = {
  ALL: "all",
  LAST: "last",
  FREQUENCY: "frequency",
} as const;

export type MatchingStrategies =
  (typeof MatchingStrategies)[keyof typeof MatchingStrategies];

export type Filter = string | (string | string[])[];

export type Query = {
  q?: string | null;
};

export type Highlight = {
  attributesToHighlight?: string[];
  highlightPreTag?: string;
  highlightPostTag?: string;
};

export type Crop = {
  attributesToCrop?: string[];
  cropLength?: number;
  cropMarker?: string;
};

// `facetName` becomes mandatory when using `searchForFacetValues`
export type SearchForFacetValuesParams = Omit<SearchParams, "facetName"> & {
  facetName: string;
};

export type FacetHit = {
  value: string;
  count: number;
};

export type SearchForFacetValuesResponse = {
  facetHits: FacetHit[];
  facetQuery: string | null;
  processingTimeMs: number;
};

export type HybridSearch = {
  embedder: string;
  semanticRatio?: number;
};

// https://www.meilisearch.com/docs/reference/api/settings#localized-attributes
export type Locale = string;

export type SearchParams = Query &
  Pagination &
  Highlight &
  Crop & {
    filter?: Filter;
    sort?: string[];
    facets?: string[];
    attributesToRetrieve?: string[];
    showMatchesPosition?: boolean;
    matchingStrategy?: MatchingStrategies;
    hitsPerPage?: number;
    page?: number;
    facetName?: string;
    facetQuery?: string;
    vector?: number[] | null;
    showRankingScore?: boolean;
    showRankingScoreDetails?: boolean;
    rankingScoreThreshold?: number;
    attributesToSearchOn?: string[] | null;
    hybrid?: HybridSearch;
    distinct?: string;
    retrieveVectors?: boolean;
    locales?: Locale[];
  };

// Search parameters for searches made with the GET method
// Are different than the parameters for the POST method
export type SearchRequestGET = Pagination &
  Query &
  Omit<Highlight, "attributesToHighlight"> &
  Omit<Crop, "attributesToCrop"> & {
    filter?: string;
    sort?: string;
    facets?: string;
    attributesToRetrieve?: string;
    attributesToHighlight?: string;
    attributesToCrop?: string;
    showMatchesPosition?: boolean;
    vector?: string | null;
    attributesToSearchOn?: string | null;
    hybridEmbedder?: string;
    hybridSemanticRatio?: number;
    rankingScoreThreshold?: number;
    distinct?: string;
    retrieveVectors?: boolean;
    locales?: Locale[];
  };

export type MergeFacets = {
  maxValuesPerFacet?: number | null;
};

export type FederationOptions = { weight: number; remote?: string };
export type MultiSearchFederation = {
  limit?: number;
  offset?: number;
  facetsByIndex?: Record<string, string[]>;
  mergeFacets?: MergeFacets | null;
};

export type MultiSearchQuery = SearchParams & { indexUid: string };
export type MultiSearchQueryWithFederation = MultiSearchQuery & {
  federationOptions?: FederationOptions;
};

export type MultiSearchParams = {
  queries: MultiSearchQuery[];
};
export type FederatedMultiSearchParams = {
  federation: MultiSearchFederation;
  queries: MultiSearchQueryWithFederation[];
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/network#the-remote-object}
 *
 * @see `meilisearch_types::features::Remote` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Remote = {
  url: string;
  searchApiKey: string | null;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/network#the-network-object}
 *
 * @see `meilisearch_types::features::Network` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Network = {
  self: string | null;
  remotes: Record<string, Remote>;
};

export type CategoriesDistribution = {
  [category: string]: number;
};

export type Facet = string;
export type FacetDistribution = Record<Facet, CategoriesDistribution>;
export type MatchesPosition<T> = Partial<
  Record<keyof T, { start: number; length: number; indices?: number[] }[]>
>;

export type RankingScoreDetails = {
  words?: {
    order: number;
    matchingWords: number;
    maxMatchingWords: number;
    score: number;
  };
  typo?: {
    order: number;
    typoCount: number;
    maxTypoCount: number;
    score: number;
  };
  proximity?: {
    order: number;
    score: number;
  };
  attribute?: {
    order: number;
    attributes_ranking_order: number;
    attributes_query_word_order: number;
    score: number;
  };
  exactness?: {
    order: number;
    matchType: string;
    score: number;
  };
  [key: string]: RecordAny | undefined;
};

export type FederationDetails = {
  indexUid: string;
  queriesPosition: number;
  weightedRankingScore: number;
};

export type Hit<T = RecordAny> = T & {
  _formatted?: Partial<T>;
  _matchesPosition?: MatchesPosition<T>;
  _rankingScore?: number;
  _rankingScoreDetails?: RankingScoreDetails;
  _federation?: FederationDetails;
};

export type Hits<T = RecordAny> = Hit<T>[];

export type FacetStat = { min: number; max: number };
export type FacetStats = Record<string, FacetStat>;

export type FacetsByIndex = Record<
  string,
  {
    distribution: FacetDistribution;
    stats: FacetStats;
  }
>;

export type SearchResponse<
  T = RecordAny,
  S extends SearchParams | undefined = undefined,
> = {
  hits: Hits<T>;
  processingTimeMs: number;
  query: string;
  facetDistribution?: FacetDistribution;
  facetStats?: FacetStats;
  facetsByIndex?: FacetsByIndex;
} & (undefined extends S
  ? Partial<FinitePagination & InfinitePagination>
  : true extends IsFinitePagination<NonNullable<S>>
    ? FinitePagination
    : InfinitePagination);

type FinitePagination = {
  totalHits: number;
  hitsPerPage: number;
  page: number;
  totalPages: number;
};
type InfinitePagination = {
  offset: number;
  limit: number;
  estimatedTotalHits: number;
};

type IsFinitePagination<S extends SearchParams> = Or<
  HasHitsPerPage<S>,
  HasPage<S>
>;

type Or<A extends boolean, B extends boolean> = true extends A
  ? true
  : true extends B
    ? true
    : false;

type HasHitsPerPage<S extends SearchParams> = undefined extends S["hitsPerPage"]
  ? false
  : true;

type HasPage<S extends SearchParams> = undefined extends S["page"]
  ? false
  : true;

export type MultiSearchResult<T> = SearchResponse<T> & { indexUid: string };

export type MultiSearchResponse<T = RecordAny> = {
  results: MultiSearchResult<T>[];
};

export type MultiSearchResponseOrSearchResponse<
  T1 extends FederatedMultiSearchParams | MultiSearchParams,
  T2 extends RecordAny = RecordAny,
> = T1 extends FederatedMultiSearchParams
  ? SearchResponse<T2>
  : MultiSearchResponse<T2>;

export type FieldDistribution = Record<string, number>;

export type SearchSimilarDocumentsParams = {
  id: string | number;
  offset?: number;
  limit?: number;
  filter?: Filter;
  embedder?: string;
  attributesToRetrieve?: string[];
  showRankingScore?: boolean;
  showRankingScoreDetails?: boolean;
  rankingScoreThreshold?: number;
};

/*
 ** Documents
 */

type Fields<T = RecordAny> =
  | Extract<keyof T, string>[]
  | Extract<keyof T, string>;

export type DocumentOptions = {
  primaryKey?: string;
};

export const ContentTypeEnum: Readonly<Record<string, ContentType>> = {
  JSON: "application/json",
  CSV: "text/csv",
  NDJSON: "application/x-ndjson",
};

export type ContentType =
  | "text/csv"
  | "application/x-ndjson"
  | "application/json";

export type RawDocumentAdditionOptions = DocumentOptions & {
  csvDelimiter?: string;
};

export type DocumentsQuery<T = RecordAny> = ResourceQuery & {
  fields?: Fields<T>;
  filter?: Filter;
  limit?: number;
  offset?: number;
  retrieveVectors?: boolean;
};

export type DocumentQuery<T = RecordAny> = {
  fields?: Fields<T>;
};

export type DocumentsDeletionQuery = {
  filter: Filter;
};

export type DocumentsIds = string[] | number[];

export type UpdateDocumentsByFunctionOptions = {
  function: string;
  filter?: string | string[];
  context?: RecordAny;
};

/*
 ** Settings
 */

export type FilterableAttributes = string[] | null;
export type DistinctAttribute = string | null;
export type SearchableAttributes = string[] | null;
export type SortableAttributes = string[] | null;
export type DisplayedAttributes = string[] | null;
export type RankingRules = string[] | null;
export type StopWords = string[] | null;
export type Synonyms = Record<string, string[]> | null;
export type TypoTolerance = {
  enabled?: boolean | null;
  disableOnAttributes?: string[] | null;
  disableOnWords?: string[] | null;
  minWordSizeForTypos?: {
    oneTypo?: number | null;
    twoTypos?: number | null;
  };
} | null;
export type SeparatorTokens = string[] | null;
export type NonSeparatorTokens = string[] | null;
export type Dictionary = string[] | null;
export type ProximityPrecision = "byWord" | "byAttribute";

export type Distribution = {
  mean: number;
  sigma: number;
};

export type OpenAiEmbedder = {
  source: "openAi";
  model?: string;
  apiKey?: string;
  documentTemplate?: string;
  dimensions?: number;
  distribution?: Distribution;
  url?: string;
  documentTemplateMaxBytes?: number;
  binaryQuantized?: boolean;
};

export type HuggingFaceEmbedder = {
  source: "huggingFace";
  model?: string;
  revision?: string;
  documentTemplate?: string;
  distribution?: Distribution;
  documentTemplateMaxBytes?: number;
  binaryQuantized?: boolean;
};

export type UserProvidedEmbedder = {
  source: "userProvided";
  dimensions: number;
  distribution?: Distribution;
  binaryQuantized?: boolean;
};

export type RestEmbedder = {
  source: "rest";
  url: string;
  apiKey?: string;
  dimensions?: number;
  documentTemplate?: string;
  distribution?: Distribution;
  request: RecordAny;
  response: RecordAny;
  headers?: Record<string, string>;
  documentTemplateMaxBytes?: number;
  binaryQuantized?: boolean;
};

export type OllamaEmbedder = {
  source: "ollama";
  url?: string;
  apiKey?: string;
  model?: string;
  documentTemplate?: string;
  distribution?: Distribution;
  dimensions?: number;
  documentTemplateMaxBytes?: number;
  binaryQuantized?: boolean;
};

export type Embedder =
  | OpenAiEmbedder
  | HuggingFaceEmbedder
  | UserProvidedEmbedder
  | RestEmbedder
  | OllamaEmbedder
  | null;

export type Embedders = Record<string, Embedder> | null;

export type FacetOrder = "alpha" | "count";

export type Faceting = {
  maxValuesPerFacet?: number | null;
  sortFacetValuesBy?: Record<string, FacetOrder> | null;
};

export type PaginationSettings = {
  maxTotalHits?: number | null;
};

export type SearchCutoffMs = number | null;

export type LocalizedAttribute = {
  attributePatterns: string[];
  locales: Locale[];
};

export type LocalizedAttributes = LocalizedAttribute[] | null;

export type PrefixSearch = "indexingTime" | "disabled";

export type Settings = {
  filterableAttributes?: FilterableAttributes;
  distinctAttribute?: DistinctAttribute;
  sortableAttributes?: SortableAttributes;
  searchableAttributes?: SearchableAttributes;
  displayedAttributes?: DisplayedAttributes;
  rankingRules?: RankingRules;
  stopWords?: StopWords;
  synonyms?: Synonyms;
  typoTolerance?: TypoTolerance;
  faceting?: Faceting;
  pagination?: PaginationSettings;
  separatorTokens?: SeparatorTokens;
  nonSeparatorTokens?: NonSeparatorTokens;
  dictionary?: Dictionary;
  proximityPrecision?: ProximityPrecision;
  embedders?: Embedders;
  searchCutoffMs?: SearchCutoffMs;
  localizedAttributes?: LocalizedAttributes;

  /**
   * Enable facet searching on all the filters of an index (requires Meilisearch
   * 1.12.0 or later)
   */
  facetSearch?: boolean;
  /**
   * Enable the ability to search a word by prefix on an index (requires
   * Meilisearch 1.12.0 or later)
   */
  prefixSearch?: "indexingTime" | "disabled";
};

/*
 ** Keys
 */

export type Key = {
  uid: string;
  description: string;
  name: string | null;
  key: string;
  actions: string[];
  indexes: string[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type KeyCreation = {
  uid?: string;
  name?: string;
  description?: string;
  actions: string[];
  indexes: string[];
  expiresAt: Date | null;
};

export type KeyUpdate = {
  name?: string;
  description?: string;
};

export type KeysQuery = ResourceQuery & {};

export type KeysResults = ResourceResults<Key[]> & {};
