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
  /**
   * If true, the facet search will return the exhaustive count of the facet
   * values.
   */
  exhaustiveFacetCount?: boolean;
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

export type FieldDistribution = {
  [field: string]: number;
};

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
  ids?: string[] | number[];
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

type GranularFilterableAttribute = {
  attributePatterns: string[];
  features: {
    facetSearch: boolean;
    filter: { equality: boolean; comparison: boolean };
  };
};

export type FilterableAttributes =
  | (string | GranularFilterableAttribute)[]
  | null;
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
  pooling?: "useModel" | "forceMean" | "forceCls";
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

export type CompositeEmbedder = {
  source: "composite";
  searchEmbedder: Embedder;
  indexingEmbedder: Embedder;
};

export type Embedder =
  | OpenAiEmbedder
  | HuggingFaceEmbedder
  | UserProvidedEmbedder
  | RestEmbedder
  | OllamaEmbedder
  | CompositeEmbedder
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
 *** HEALTH
 */

export type Health = {
  status: "available";
};

/*
 *** STATS
 */

export type IndexStats = {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution: FieldDistribution;
  numberOfEmbeddedDocuments: number;
  numberOfEmbeddings: number;
  rawDocumentDbSize: number;
  avgDocumentSize: number;
};

export type Stats = {
  databaseSize: number;
  usedDatabaseSize: number;
  lastUpdate: string;
  indexes: {
    [index: string]: IndexStats;
  };
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

/*
 ** version
 */
export type Version = {
  commitSha: string;
  commitDate: string;
  pkgVersion: string;
};

/*
 ** ERROR HANDLER
 */

export interface FetchError extends Error {
  type: string;
  errno: string;
  code: string;
}

export type MeiliSearchErrorResponse = {
  message: string;
  // https://www.meilisearch.com/docs/reference/errors/error_codes
  code: string;
  // https://www.meilisearch.com/docs/reference/errors/overview#errors
  type: string;
  link: string;
};

// @TODO: This doesn't seem to be up to date, and its usefulness comes into question.
export const ErrorStatusCode = {
  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#index_creation_failed */
  INDEX_CREATION_FAILED: "index_creation_failed",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_index_uid */
  MISSING_INDEX_UID: "missing_index_uid",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#index_already_exists */
  INDEX_ALREADY_EXISTS: "index_already_exists",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#index_not_found */
  INDEX_NOT_FOUND: "index_not_found",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_index_uid */
  INVALID_INDEX_UID: "invalid_index_uid",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#index_not_accessible */
  INDEX_NOT_ACCESSIBLE: "index_not_accessible",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_index_offset */
  INVALID_INDEX_OFFSET: "invalid_index_offset",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_index_limit */
  INVALID_INDEX_LIMIT: "invalid_index_limit",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_state */
  INVALID_STATE: "invalid_state",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#primary_key_inference_failed */
  PRIMARY_KEY_INFERENCE_FAILED: "primary_key_inference_failed",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#index_primary_key_already_exists */
  INDEX_PRIMARY_KEY_ALREADY_EXISTS: "index_primary_key_already_exists",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_index_primary_key */
  INVALID_INDEX_PRIMARY_KEY: "invalid_index_primary_key",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#max_fields_limit_exceeded */
  DOCUMENTS_FIELDS_LIMIT_REACHED: "document_fields_limit_reached",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_document_id */
  MISSING_DOCUMENT_ID: "missing_document_id",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_document_id */
  INVALID_DOCUMENT_ID: "invalid_document_id",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_content_type */
  INVALID_CONTENT_TYPE: "invalid_content_type",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_content_type */
  MISSING_CONTENT_TYPE: "missing_content_type",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_document_fields */
  INVALID_DOCUMENT_FIELDS: "invalid_document_fields",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_document_limit */
  INVALID_DOCUMENT_LIMIT: "invalid_document_limit",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_document_offset */
  INVALID_DOCUMENT_OFFSET: "invalid_document_offset",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_document_filter */
  INVALID_DOCUMENT_FILTER: "invalid_document_filter",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_document_filter */
  MISSING_DOCUMENT_FILTER: "missing_document_filter",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_document_vectors_field */
  INVALID_DOCUMENT_VECTORS_FIELD: "invalid_document_vectors_field",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#payload_too_large */
  PAYLOAD_TOO_LARGE: "payload_too_large",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_payload */
  MISSING_PAYLOAD: "missing_payload",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#malformed_payload */
  MALFORMED_PAYLOAD: "malformed_payload",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#no_space_left_on_device */
  NO_SPACE_LEFT_ON_DEVICE: "no_space_left_on_device",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_store_file */
  INVALID_STORE_FILE: "invalid_store_file",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_ranking_rules */
  INVALID_RANKING_RULES: "missing_document_id",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_request */
  INVALID_REQUEST: "invalid_request",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_document_geo_field */
  INVALID_DOCUMENT_GEO_FIELD: "invalid_document_geo_field",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_q */
  INVALID_SEARCH_Q: "invalid_search_q",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_offset */
  INVALID_SEARCH_OFFSET: "invalid_search_offset",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_limit */
  INVALID_SEARCH_LIMIT: "invalid_search_limit",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_page */
  INVALID_SEARCH_PAGE: "invalid_search_page",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_hits_per_page */
  INVALID_SEARCH_HITS_PER_PAGE: "invalid_search_hits_per_page",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_attributes_to_retrieve */
  INVALID_SEARCH_ATTRIBUTES_TO_RETRIEVE:
    "invalid_search_attributes_to_retrieve",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_attributes_to_crop */
  INVALID_SEARCH_ATTRIBUTES_TO_CROP: "invalid_search_attributes_to_crop",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_crop_length */
  INVALID_SEARCH_CROP_LENGTH: "invalid_search_crop_length",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_attributes_to_highlight */
  INVALID_SEARCH_ATTRIBUTES_TO_HIGHLIGHT:
    "invalid_search_attributes_to_highlight",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_show_matches_position */
  INVALID_SEARCH_SHOW_MATCHES_POSITION: "invalid_search_show_matches_position",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_filter */
  INVALID_SEARCH_FILTER: "invalid_search_filter",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_sort */
  INVALID_SEARCH_SORT: "invalid_search_sort",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_facets */
  INVALID_SEARCH_FACETS: "invalid_search_facets",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_highlight_pre_tag */
  INVALID_SEARCH_HIGHLIGHT_PRE_TAG: "invalid_search_highlight_pre_tag",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_highlight_post_tag */
  INVALID_SEARCH_HIGHLIGHT_POST_TAG: "invalid_search_highlight_post_tag",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_crop_marker */
  INVALID_SEARCH_CROP_MARKER: "invalid_search_crop_marker",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_matching_strategy */
  INVALID_SEARCH_MATCHING_STRATEGY: "invalid_search_matching_strategy",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_vector */
  INVALID_SEARCH_VECTOR: "invalid_search_vector",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_attributes_to_search_on */
  INVALID_SEARCH_ATTRIBUTES_TO_SEARCH_ON:
    "invalid_search_attributes_to_search_on",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#bad_request */
  BAD_REQUEST: "bad_request",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#document_not_found */
  DOCUMENT_NOT_FOUND: "document_not_found",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#internal */
  INTERNAL: "internal",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key */
  INVALID_API_KEY: "invalid_api_key",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key_description */
  INVALID_API_KEY_DESCRIPTION: "invalid_api_key_description",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key_actions */
  INVALID_API_KEY_ACTIONS: "invalid_api_key_actions",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key_indexes */
  INVALID_API_KEY_INDEXES: "invalid_api_key_indexes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key_expires_at */
  INVALID_API_KEY_EXPIRES_AT: "invalid_api_key_expires_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#api_key_not_found */
  API_KEY_NOT_FOUND: "api_key_not_found",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_api_key_uid */
  IMMUTABLE_API_KEY_UID: "immutable_api_key_uid",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_api_key_actions */
  IMMUTABLE_API_KEY_ACTIONS: "immutable_api_key_actions",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_api_key_indexes */
  IMMUTABLE_API_KEY_INDEXES: "immutable_api_key_indexes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_api_key_expires_at */
  IMMUTABLE_API_KEY_EXPIRES_AT: "immutable_api_key_expires_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_api_key_created_at */
  IMMUTABLE_API_KEY_CREATED_AT: "immutable_api_key_created_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_api_key_updated_at */
  IMMUTABLE_API_KEY_UPDATED_AT: "immutable_api_key_updated_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_authorization_header */
  MISSING_AUTHORIZATION_HEADER: "missing_authorization_header",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#unretrievable_document */
  UNRETRIEVABLE_DOCUMENT: "unretrievable_document",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#database_size_limit_reached */
  MAX_DATABASE_SIZE_LIMIT_REACHED: "database_size_limit_reached",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#task_not_found */
  TASK_NOT_FOUND: "task_not_found",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#dump_process_failed */
  DUMP_PROCESS_FAILED: "dump_process_failed",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#dump_not_found */
  DUMP_NOT_FOUND: "dump_not_found",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_swap_duplicate_index_found */
  INVALID_SWAP_DUPLICATE_INDEX_FOUND: "invalid_swap_duplicate_index_found",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_swap_indexes */
  INVALID_SWAP_INDEXES: "invalid_swap_indexes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_swap_indexes */
  MISSING_SWAP_INDEXES: "missing_swap_indexes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_master_key */
  MISSING_MASTER_KEY: "missing_master_key",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_types */
  INVALID_TASK_TYPES: "invalid_task_types",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_uids */
  INVALID_TASK_UIDS: "invalid_task_uids",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_statuses */
  INVALID_TASK_STATUSES: "invalid_task_statuses",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_limit */
  INVALID_TASK_LIMIT: "invalid_task_limit",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_from */
  INVALID_TASK_FROM: "invalid_task_from",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_canceled_by */
  INVALID_TASK_CANCELED_BY: "invalid_task_canceled_by",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_task_filters */
  MISSING_TASK_FILTERS: "missing_task_filters",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#too_many_open_files */
  TOO_MANY_OPEN_FILES: "too_many_open_files",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#io_error */
  IO_ERROR: "io_error",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_index_uids */
  INVALID_TASK_INDEX_UIDS: "invalid_task_index_uids",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_index_uid */
  IMMUTABLE_INDEX_UID: "immutable_index_uid",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_index_created_at */
  IMMUTABLE_INDEX_CREATED_AT: "immutable_index_created_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#immutable_index_updated_at */
  IMMUTABLE_INDEX_UPDATED_AT: "immutable_index_updated_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_displayed_attributes */
  INVALID_SETTINGS_DISPLAYED_ATTRIBUTES:
    "invalid_settings_displayed_attributes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_searchable_attributes */
  INVALID_SETTINGS_SEARCHABLE_ATTRIBUTES:
    "invalid_settings_searchable_attributes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_filterable_attributes */
  INVALID_SETTINGS_FILTERABLE_ATTRIBUTES:
    "invalid_settings_filterable_attributes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_sortable_attributes */
  INVALID_SETTINGS_SORTABLE_ATTRIBUTES: "invalid_settings_sortable_attributes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_ranking_rules */
  INVALID_SETTINGS_RANKING_RULES: "invalid_settings_ranking_rules",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_stop_words */
  INVALID_SETTINGS_STOP_WORDS: "invalid_settings_stop_words",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_synonyms */
  INVALID_SETTINGS_SYNONYMS: "invalid_settings_synonyms",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_distinct_attribute */
  INVALID_SETTINGS_DISTINCT_ATTRIBUTE: "invalid_settings_distinct_attribute",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_typo_tolerance */
  INVALID_SETTINGS_TYPO_TOLERANCE: "invalid_settings_typo_tolerance",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_faceting */
  INVALID_SETTINGS_FACETING: "invalid_settings_faceting",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_pagination */
  INVALID_SETTINGS_PAGINATION: "invalid_settings_pagination",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_search_cutoff_ms */
  INVALID_SETTINGS_SEARCH_CUTOFF_MS: "invalid_settings_search_cutoff_ms",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_settings_search_cutoff_ms */
  INVALID_SETTINGS_LOCALIZED_ATTRIBUTES:
    "invalid_settings_localized_attributes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_before_enqueued_at */
  INVALID_TASK_BEFORE_ENQUEUED_AT: "invalid_task_before_enqueued_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_after_enqueued_at */
  INVALID_TASK_AFTER_ENQUEUED_AT: "invalid_task_after_enqueued_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_before_started_at */
  INVALID_TASK_BEFORE_STARTED_AT: "invalid_task_before_started_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_after_started_at */
  INVALID_TASK_AFTER_STARTED_AT: "invalid_task_after_started_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_before_finished_at */
  INVALID_TASK_BEFORE_FINISHED_AT: "invalid_task_before_finished_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_task_after_finished_at */
  INVALID_TASK_AFTER_FINISHED_AT: "invalid_task_after_finished_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_api_key_actions */
  MISSING_API_KEY_ACTIONS: "missing_api_key_actions",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_api_key_indexes */
  MISSING_API_KEY_INDEXES: "missing_api_key_indexes",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_api_key_expires_at */
  MISSING_API_KEY_EXPIRES_AT: "missing_api_key_expires_at",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key_limit */
  INVALID_API_KEY_LIMIT: "invalid_api_key_limit",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key_offset */
  INVALID_API_KEY_OFFSET: "invalid_api_key_offset",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_facet_search_facet_name */
  INVALID_FACET_SEARCH_FACET_NAME: "invalid_facet_search_facet_name",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#missing_facet_search_facet_name */
  MISSING_FACET_SEARCH_FACET_NAME: "missing_facet_search_facet_name",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_facet_search_facet_query */
  INVALID_FACET_SEARCH_FACET_QUERY: "invalid_facet_search_facet_query",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_search_ranking_score_threshold */
  INVALID_SEARCH_RANKING_SCORE_THRESHOLD:
    "invalid_search_ranking_score_threshold",

  /** @see https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_similar_ranking_score_threshold */
  INVALID_SIMILAR_RANKING_SCORE_THRESHOLD:
    "invalid_similar_ranking_score_threshold",
};

export type ErrorStatusCode =
  (typeof ErrorStatusCode)[keyof typeof ErrorStatusCode];
