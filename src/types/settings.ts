type ProximityPrecision = "byWord" | "byAttribute";

type TypoTolerance = {
  enabled?: boolean | null;
  minWordSizeForTypos?: {
    oneTypo?: number | null;
    twoTypos?: number | null;
  } | null;
  disableOnWords?: string[] | null;
  disableOnAttributes?: string[] | null;
};

type FacetOrder = "alpha" | "count";

type Faceting = {
  maxValuesPerFacet?: number | null;
  sortFacetValuesBy?: Record<string, FacetOrder> | null;
};

type PaginationSettings = { maxTotalHits?: number | null };

type Distribution = {
  mean: number;
  sigma: number;
};

type EmbeddingSettings = {
  source?: "openAi" | "huggingFace" | "ollama" | "userProvided" | "rest";
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

type LocalizedAttribute = {
  attributePatterns: string[] | null;
  locales: string[] | null;
};

type PrefixSearch = "indexingTime" | "disabled";

type NoNullField<T> = {
  [P in keyof T]: T[P] extends any[]
    ? Array<NoNullField<T[P][number]>>
    : T[P] extends Record<string, any>
      ? NoNullField<T[P]>
      : NonNullable<T[P]>;
};

/** `meilisearch_types::settings::Settings` */
export type UpdateableSettings = {
  displayedAttributes?: string[] | null;
  searchableAttributes?: string[] | null;
  filterableAttributes?: string[] | null;
  sortableAttributes?: string[] | null;
  rankingRules?: string[] | null;
  stopWords?: string[] | null;
  nonSeparatorTokens?: string[] | null;
  separatorTokens?: string[] | null;
  dictionary?: string[] | null;
  //
  synonyms?: Record<string, string[]> | null;
  distinctAttribute?: string | null;
  proximityPrecision?: ProximityPrecision | null;
  typoTolerance?: TypoTolerance | null;
  //
  faceting?: Faceting | null;
  pagination?: PaginationSettings | null;
  //
  embedders?: Record<string, EmbeddingSettings> | null;
  searchCutoffMs?: number | null;
  localizedAttributes?: LocalizedAttribute[] | null;
  facetSearch?: boolean | null;
  prefixSearch?: PrefixSearch | null;
};

export type RenameMeSettings = Required<UpdateableSettings>;

export type Settings = NoNullField<UpdateableSettings>;
