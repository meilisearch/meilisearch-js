import type { PascalToCamelCase } from "./shared.js";
import type { RecordAny, SearchParams } from "./types.js";

/** @see `milli::filterable_attributes_rules::FilterFeatures` */
export type FilterFeatures = {
  equality?: boolean;
  comparison?: boolean;
};

/** @see `milli::filterable_attributes_rules::FilterableAttributesFeatures` */
export type FilterableAttributesFeatures = {
  facetSearch?: boolean;
  filter?: FilterFeatures;
};

/** @see `milli::filterable_attributes_rules::FilterableAttributesPatterns` */
export type FilterableAttributesPatterns = {
  attributePatterns: string[];
  features?: FilterableAttributesFeatures;
};

/** @see `milli::filterable_attributes_rules::FilterableAttributesRule` */
export type FilterableAttributesRule = string | FilterableAttributesPatterns;

/** Deeply map every property of a record to itself excluding null. */
type NonNullableDeepRecordValues<T> = {
  [TKey in keyof T]: Exclude<NonNullableDeepRecordValues<T[TKey]>, null>;
};

/** Map properties of a record to be optional and nullable. */
type PartialAndNullable<T> = { [P in keyof T]?: T[P] | null };

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#proximity-precision}
 *
 * @see `meilisearch_types::settings::ProximityPrecisionView`
 */
export type ProximityPrecisionView = PascalToCamelCase<
  "ByWord" | "ByAttribute"
>;

/**
 * @see `minWordSizeForTypos` at {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance}
 *
 * @see `meilisearch_types::settings::MinWordSizeTyposSetting`
 */
export type MinWordSizeTyposSetting = PartialAndNullable<{
  oneTypo: number;
  twoTypos: number;
}>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance}
 *
 * @see `meilisearch_types::settings::TypoSettings`
 */
export type TypoSettings = PartialAndNullable<{
  enabled: boolean;
  minWordSizeForTypos: MinWordSizeTyposSetting;
  disableOnWords: string[];
  disableOnAttributes: string[];
  disableOnNumbers: boolean;
}>;

/**
 * @see `sortFacetValuesBy` at {@link https://www.meilisearch.com/docs/reference/api/settings#faceting}
 * @see `meilisearch_types::facet_values_sort::FacetValuesSort`
 */
export type FacetValuesSort = PascalToCamelCase<"Alpha" | "Count">;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#faceting}
 *
 * @see `meilisearch_types::settings::FacetingSettings`
 */
export type FacetingSettings = PartialAndNullable<{
  maxValuesPerFacet: number;
  sortFacetValuesBy: Record<string, FacetValuesSort>;
}>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#pagination}
 *
 * @see `meilisearch_types::settings::PaginationSettings`
 */
export type PaginationSettings = PartialAndNullable<{ maxTotalHits: number }>;

/**
 * `distribution` at
 * {@link https://www.meilisearch.com/docs/reference/api/settings#embedders}
 *
 * @see `milli::vector::DistributionShift`
 */
export type DistributionShift = {
  mean: number;
  sigma: number;
};

/**
 * `source` at
 * {@link https://www.meilisearch.com/docs/reference/api/settings#embedders}
 *
 * @see `milli::vector::settings::EmbedderSource`
 */
export type EmbedderSource = PascalToCamelCase<
  "OpenAi" | "HuggingFace" | "Ollama" | "UserProvided" | "Rest" | "Composite"
>;

/** @see `milli::vector::hf::OverridePooling` */
export type OverridePooling = PascalToCamelCase<
  "UseModel" | "ForceCls" | "ForceMean"
>;

/**
 * Indexing or search fragments
 *
 * @example
 *
 * ```typescript
 * const fragments: EmbedderFragments = {
 *   textAndPoster: {
 *     value: {
 *       content: [
 *         {
 *           type: "text",
 *           text: "A movie titled {{doc.title}} whose description starts with {{doc.overview|truncatewords:20}}.",
 *         },
 *         {
 *           type: "image_url",
 *           image_url: "{{doc.poster}}",
 *         },
 *       ],
 *     },
 *   },
 * };
 * ```
 */
export type EmbedderFragments = Record<string, { value: RecordAny }>;

/** @see `milli::vector::settings::SubEmbeddingSettings` */
export type SubEmbeddingSettings = PartialAndNullable<{
  source: EmbedderSource;
  model: string;
  revision: string;
  pooling: OverridePooling;
  apiKey: string;
  dimensions: number;
  documentTemplate: string;
  documentTemplateMaxBytes: number;
  url: string;
  indexingFragments: EmbedderFragments;
  searchFragments: EmbedderFragments;
  request: unknown;
  response: unknown;
  headers: Record<string, string>;
}>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#embedders}
 *
 * @see `milli::vector::settings::EmbeddingSettings`
 */
export type EmbeddingSettings = PartialAndNullable<{
  distribution: DistributionShift;
  binaryQuantized: boolean;
  searchEmbedder: SubEmbeddingSettings;
  indexingEmbedder: SubEmbeddingSettings;
}> &
  SubEmbeddingSettings;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#localized-attributes}
 *
 * @see `meilisearch_types::locales::LocalizedAttributesRuleView`
 */
export type LocalizedAttributesRuleView = {
  /** @see `milli::attribute_patterns::AttributePatterns` */
  attributePatterns: string[];
  /** @see `meilisearch_types::locales::Locale` */
  locales: string[];
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#prefix-search}
 *
 * @see `meilisearch_types::settings::PrefixSearchSettings`
 */
export type PrefixSearchSettings = PascalToCamelCase<
  "IndexingTime" | "Disabled"
>;

/** @see `meilisearch_types::settings::RankingRuleView` */
export type RankingRuleView =
  | PascalToCamelCase<
      "Words" | "Typo" | "Proximity" | "Attribute" | "Sort" | "Exactness"
    >
  | `${string}:${"asc" | "desc"}`;

/** @see `milli::update::chat::ChatSettings` */
export type ChatSettings = PartialAndNullable<{
  description: string;
  documentTemplate: string;
  documentTemplateMaxBytes: number;
  /** @see `milli::update::chat::ChatSearchParams` */
  searchParameters: SearchParams;
}>;

/** @see `milli::vector::store::VectorStoreBackend` */
export type VectorStoreBackend = "stable" | "experimental";

/** A version of {@link Settings} that can be used to update the settings. */
export type UpdatableSettings = PartialAndNullable<{
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#displayed-attributes} */
  displayedAttributes: string[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#searchable-attributes} */
  searchableAttributes: string[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#filterable-attributes} */
  filterableAttributes: FilterableAttributesRule[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#sortable-attributes} */
  sortableAttributes: string[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#ranking-rules} */
  rankingRules: RankingRuleView[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#stop-words} */
  stopWords: string[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#non-separator-tokens} */
  nonSeparatorTokens: string[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#separator-tokens} */
  separatorTokens: string[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#dictionary} */
  dictionary: string[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#synonyms} */
  synonyms: Record<string, string[]>;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#distinct-attribute} */
  distinctAttribute: string;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#proximity-precision} */
  proximityPrecision: ProximityPrecisionView;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#typo-tolerance} */
  typoTolerance: TypoSettings;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#faceting} */
  faceting: FacetingSettings;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#pagination} */
  pagination: PaginationSettings;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#embedders} */
  embedders: PartialAndNullable<Record<string, EmbeddingSettings>>;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#search-cutoff} */
  searchCutoffMs: number;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#localized-attributes} */
  localizedAttributes: LocalizedAttributesRuleView[];
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#facet-search} */
  facetSearch: boolean;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#prefix-search} */
  prefixSearch: PrefixSearchSettings;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#chat} */
  chat: ChatSettings;
  /** {@link https://www.meilisearch.com/docs/reference/api/settings#vector-store} */
  vectorStore: VectorStoreBackend;
}>;

/**
 * A version of {@link UpdatableSettings}, the first layer of properties of which
 * is used to update or get individual settings.
 */
export type SingleUpdatableSettings = Required<UpdatableSettings>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/settings#body}
 *
 * @see `meilisearch_types::settings::Settings`
 */
export type Settings = NonNullableDeepRecordValues<UpdatableSettings>;
