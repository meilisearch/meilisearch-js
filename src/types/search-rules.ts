import type { Filter } from "./types.js";

export type SearchRuleListFilterPayload = {
  query?: string | null;
  active?: boolean | null;
};

export type SearchRuleListPayload = {
  offset?: number;
  limit?: number;
  filter?: SearchRuleListFilterPayload | null;
};

/** Pin a document to a fixed result position */
export type SearchRulePin = {
  id: string;
  position: number;
  indexUid?: string | null;
};

/**
 * Scale selected documents' relevancy
 *
 * Weight `> 1` boosts, `< 1` demotes, and `0` hides.
 */
export type SearchRuleScale = {
  weight: number;
  ids?: string[];
  filter?: Filter;
  indexUid?: string | null;
};

/** Actions applied when the rule matches */
export type SearchRuleActions = {
  pin?: SearchRulePin[];
  scale?: SearchRuleScale[];
};

export type SearchRuleQueryCondition = {
  isEmpty?: boolean | null;
  words?: string | null;
};

export type SearchRuleTimeCondition = {
  start?: string | null;
  end?: string | null;
};

/**
 * JSON value accepted by a dynamic search rule filter condition
 *
 * Matches any JSON value the engine accepts, including arrays and nested
 * objects.
 */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Filter condition for a dynamic search rule */
export type SearchRuleFilterCondition = {
  /** Facet values that activate the rule, including nested values */
  values: Record<string, JsonValue>;
};

/** Conditions that must match before the dynamic search rule applies. */
export type SearchRuleConditions = {
  query?: SearchRuleQueryCondition | null;
  time?: SearchRuleTimeCondition | null;
  filter?: SearchRuleFilterCondition | null;
};

/** Dynamic search rule object */
export type SearchRule = {
  uid: string;
  description?: string | null;
  lastUpdatedAt?: string | null;
  precedence?: number | null;
  active?: boolean;
  conditions?: SearchRuleConditions;
  actions: SearchRuleActions;
};

/** Partial update payload for a dynamic search rule */
export type SearchRuleUpdatePayload = {
  description?: string | null;
  precedence?: number | null;
  active?: boolean | null;
  conditions?: SearchRuleConditions | null;
  actions?: SearchRuleActions | null;
};

/**
 * Dynamic search rule applied only to the current search query
 *
 * @experimental
 * @see {@link https://www.meilisearch.com/docs/reference/api/search/search-with-post}
 * @see {@link https://github.com/meilisearch/meilisearch/releases/tag/v1.55.0}
 */
export type InlineRule = {
  /** Unique identifier of the rule */
  uid: string;
  /**
   * Precedence when several rules match
   *
   * Lower numbers win.
   */
  precedence?: number | null;
  /**
   * Whether the rule is active
   *
   * Inactive rules never apply, but their conditions are still evaluated.
   */
  active?: boolean | null;
  /** Conditions that must match before the rule applies */
  conditions?: SearchRuleConditions | null;
  /** Actions applied when the rule matches */
  actions?: SearchRuleActions | null;
};

/**
 * Time-condition outcome for an inline rule
 *
 * Omitted when the rule has no time condition.
 *
 * @experimental
 */
export type TimeConditionOutcome = "satisfied" | "tooEarly" | "tooLate";

/**
 * Query-emptiness outcome for an inline rule
 *
 * Omitted when the rule has no query emptiness condition.
 *
 * @experimental
 */
export type QueryEmptyConditionOutcome =
  "satisfied" | "queryNotEmpty" | "queryEmpty";

/**
 * Query-words outcome for an inline rule
 *
 * Omitted when the rule has no query words condition.
 *
 * @experimental
 */
export type QueryWordsConditionOutcome =
  "satisfied" | { missingWord: { word: string } };

/**
 * Filter-condition outcome for an inline rule
 *
 * Omitted when the rule has no filter condition.
 *
 * @experimental
 */
export type FilterConditionOutcome =
  | "satisfied"
  | { missingConstraintOnField: { field: string } }
  | { unmetConstraintOnField: { field: string } }
  | {
      notEnoughFields: {
        fieldCountInFilter: number;
        fieldCountInCondition: number;
      };
    };

/**
 * Result of checking an inline rule's conditions against the query
 *
 * @experimental
 * @see {@link https://www.meilisearch.com/docs/reference/api/search/search-with-post}
 * @see {@link https://github.com/meilisearch/meilisearch/releases/tag/v1.55.0}
 */
export type InlineRuleConditionOutcomes = {
  /** Whether the rule is active */
  satisfiesActiveCondition: boolean;
  /** Whether the current time falls in the rule's time range */
  satisfiesTimeCondition?: TimeConditionOutcome;
  /** Whether the query's emptiness matches the rule */
  satisfiesQueryEmptyCondition?: QueryEmptyConditionOutcome;
  /** Whether the query contains every word required by the rule */
  satisfiesQueryWordsCondition?: QueryWordsConditionOutcome;
  /** Whether the query filter meets the rule's filter condition */
  satisfiesFilterCondition?: FilterConditionOutcome;
};

/**
 * Search metadata included when `Meili-Include-Metadata` is `true`
 *
 * @experimental
 * @see {@link https://www.meilisearch.com/docs/reference/api/search/search-with-post}
 * @see {@link https://github.com/meilisearch/meilisearch/releases/tag/v1.55.0}
 */
export type SearchMetadata = {
  /**
   * Query string
   *
   * Present for a federated multi-search query that is not a placeholder
   * search.
   */
  query?: string;
  /** Unique identifier of the query */
  queryUid: string;
  /** UID of the index that was searched */
  indexUid: string;
  /** Primary key of the index */
  primaryKey?: string;
  /** Remote that processed the query */
  remote?: string;
  /** Condition check for the inline rule sent with the query */
  inlineRuleConditionOutcomes?: InlineRuleConditionOutcomes;
};
