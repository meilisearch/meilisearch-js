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

/** Filter condition for a dynamic search rule */
export type SearchRuleFilterCondition = {
  /** Expected facet values for filter activation */
  values: Record<string, string>;
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
