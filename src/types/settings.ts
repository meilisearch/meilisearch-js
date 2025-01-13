export type DisplayedAttribute = string;

export type SearchableAttribute = string;

export type FilterableAttribute = string;

export type SortableAttribute = string;

export type RankingRule = string;

export type StopWord = string;

export type NonSeparatorToken = string;

export type SeparatorToken = string;

export type DictionaryElement = string;

export type Synonyms = Record<string, string[]>;

export type DistinctAttribute = string;

export type ProximityPrecision = "byWord" | "byAttribute";

export type TypoTolerance = {
  enabled?: boolean;
  minWordSizeForTypos?: { oneTypo?: number; twoTypos?: number };
  disableOnWords?: string[];
  disableOnAttributes?: string[];
};

export type FacetOrder = "alpha" | "count";

export type Faceting = {
  maxValuesPerFacet?: number;
  sortFacetValuesBy?: Record<string, FacetOrder>;
};

export type PaginationSettings = { maxTotalHits?: number };

export type Distribution = {
  mean: number;
  sigma: number;
};

export type EmbeddingSettings = {
  source?: "openAi" | "huggingFace" | "ollama" | "userProvided" | "rest";
  model?: string;
  revision?: string;
  apiKey?: string;
  dimensions?: number;
  binaryQuantized?: boolean;
  documentTemplate?: string;
  documentTemplateMaxBytes?: number;
  url?: string;
  request?: unknown;
  response?: unknown;
  headers?: Record<string, string>;
  distribution?: Distribution;
};

export type Embedders = Record<string, EmbeddingSettings>;

export type SearchCutoffMs = number;

export type LocalizedAttribute = {
  attributePatterns: string[];
  locales: string[];
};

export type FacetSearch = boolean;

export type PrefixSearch = "indexingTime" | "disabled";

/** `meilisearch_types::settings::Settings` */
export type Settings = {
  displayedAttributes?: DisplayedAttribute[];
  searchableAttributes?: SearchableAttribute[];
  filterableAttributes?: FilterableAttribute[];
  sortableAttributes?: SortableAttribute[];
  rankingRules?: RankingRule[];
  stopWords?: StopWord[];
  nonSeparatorTokens?: NonSeparatorToken[];
  separatorTokens?: SeparatorToken[];
  dictionary?: DictionaryElement[];
  synonyms?: Synonyms;
  distinctAttribute?: DistinctAttribute;
  proximityPrecision?: ProximityPrecision;
  typoTolerance?: TypoTolerance;
  faceting?: Faceting;
  pagination?: PaginationSettings;
  embedders?: Embedders;
  searchCutoffMs?: SearchCutoffMs;
  localizedAttributes?: LocalizedAttribute[];
  facetSearch?: FacetSearch;
  prefixSearch?: PrefixSearch;
};
