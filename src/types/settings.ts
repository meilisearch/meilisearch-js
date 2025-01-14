import type { NoNullField } from "./shared.js";

/** {@link https://www.meilisearch.com/docs/reference/api/settings#proximity-precision} */
export type ProximityPrecision = "byWord" | "byAttribute";

/** {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance} */
export type TypoTolerance = {
  enabled?: boolean | null;
  minWordSizeForTypos?: {
    oneTypo?: number | null;
    twoTypos?: number | null;
  } | null;
  disableOnWords?: string[] | null;
  disableOnAttributes?: string[] | null;
};

export type FacetOrder = "alpha" | "count";

/** {@link https://www.meilisearch.com/docs/reference/api/settings#faceting} */
export type Faceting = {
  maxValuesPerFacet?: number | null;
  sortFacetValuesBy?: Record<string, FacetOrder> | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#pagination} */
export type PaginationSettings = { maxTotalHits?: number | null };

export type Distribution = {
  mean: number;
  sigma: number;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#embedders-experimental} */
export type EmbeddingSettings = {
  source?: "openAi" | "huggingFace" | "ollama" | "userProvided" | "rest" | null;
  model?: string | null;
  revision?: string | null;
  apiKey?: string | null;
  dimensions?: number | null;
  binaryQuantized?: boolean | null;
  documentTemplate?: string | null;
  documentTemplateMaxBytes?: number | null;
  url?: string | null;
  request?: unknown;
  response?: unknown;
  headers?: Record<string, string> | null;
  distribution?: Distribution | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#localized-attributes} */
export type LocalizedAttribute = {
  attributePatterns: string[] | null;
  locales: string[] | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/settings#prefix-search} */
export type PrefixSearch = "indexingTime" | "disabled";

export type UpdateableSettings = {
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#displayed-attributes} */
  displayedAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#searchable-attributes} */
  searchableAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#filterable-attributes} */
  filterableAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#sortable-attributes} */
  sortableAttributes?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#ranking-rules} */
  rankingRules?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#stop-words} */
  stopWords?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#non-separator-tokens} */
  nonSeparatorTokens?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#separator-tokens} */
  separatorTokens?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#dictionary} */
  dictionary?: string[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#synonyms} */
  synonyms?: Record<string, string[]> | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#distinct-attribute} */
  distinctAttribute?: string | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#proximity-precision} */
  proximityPrecision?: ProximityPrecision | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance} */
  typoTolerance?: TypoTolerance | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#faceting} */
  faceting?: Faceting | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#pagination} */
  pagination?: PaginationSettings | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#embedders-experimental} */
  embedders?: Record<string, EmbeddingSettings> | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#search-cutoff} */
  searchCutoffMs?: number | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#localized-attributes} */
  localizedAttributes?: LocalizedAttribute[] | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#facet-search} */
  facetSearch?: boolean | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#prefix-search} */
  prefixSearch?: PrefixSearch | null;
};

export type RenameMeSettings = Required<UpdateableSettings>;

/**
 * TODO
 *
 * @see {@link https://www.meilisearch.com/docs/reference/api/settings#settings}
 * @see `meilisearch_types::settings::Settings` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Settings = NoNullField<UpdateableSettings>;
