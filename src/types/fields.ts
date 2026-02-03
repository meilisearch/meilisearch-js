import type { Locale, ResourceQuery, ResourceResults } from "./types.js";

type IndexFieldToggle = {
  enabled: boolean;
};

type IndexFieldRankingRule = {
  enabled: boolean;
  order?: "asc" | "desc";
};

type IndexFieldFilterable = {
  enabled: boolean;
  sortBy?: "alpha" | "count";
  facetSearch?: boolean;
  equality?: boolean;
  comparison?: boolean;
};

type IndexFieldLocalized = {
  locales: Locale[];
};

/**
 * Represents a single field in the index with its capabilities and
 * configuration.
 */
export type IndexField = {
  name: string;
  displayed?: IndexFieldToggle;
  searchable?: IndexFieldToggle;
  sortable?: IndexFieldToggle;
  distinct?: IndexFieldToggle;
  rankingRule?: IndexFieldRankingRule;
  filterable?: IndexFieldFilterable;
  localized?: IndexFieldLocalized;
};

/**
 * Filter configuration for querying fields.
 *
 * When multiple filters are used, they are combined with a logical AND.
 *
 * - AttributePatterns: Match fields using attribute patterns (supports wildcards)
 * - Displayed: true = only displayed fields, false = only hidden fields
 * - Searchable: true = only searchable fields, false = only non-searchable fields
 * - Sortable: true = only sortable fields, false = only non-sortable fields
 * - Distinct: true = only the distinct field, false = only non-distinct fields
 * - RankingRule: true = only fields used in ranking, false = only fields not used
 *   in ranking
 * - Filterable: true = only filterable fields, false = only non-filterable fields
 */
export type FieldsFilter = {
  attributePatterns?: string[];
  displayed?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  distinct?: boolean;
  rankingRule?: boolean;
  filterable?: boolean;
};

/** Query parameters for retrieving fields from an index. */
export type FieldsQuery = ResourceQuery & {
  filter?: FieldsFilter;
};

/** Paginated fields response (results, offset, limit, total). */
export type FieldsResults = ResourceResults<IndexField[]>;
