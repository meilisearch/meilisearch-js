/** Filter object accepted by dynamic search rules list queries. */
export type DynamicSearchRulesFilter = {
  attributePatterns?: string[] | null;
  active?: boolean | null;
};

/** POST body for listing dynamic search rules. */
export type DynamicSearchRulesQuery = {
  offset?: number;
  limit?: number;
  filter?: DynamicSearchRulesFilter | null;
};

/** Selector to target a document in a rule action. */
export type DynamicSearchRuleSelector = {
  indexUid?: string | null;
  id?: string | null;
};

/** Pin action payload. */
export type DynamicSearchRuleActionPin = {
  type: "pin";
  position: number;
};

/** Rule action object with pin-only action type. */
export type DynamicSearchRuleRuleAction = {
  selector: DynamicSearchRuleSelector;
  action: DynamicSearchRuleActionPin;
};

/** Query-scoped condition for dynamic search rules. */
export type DynamicSearchRuleQueryCondition = {
  scope: "query";
  isEmpty?: boolean | null;
  contains?: string | null;
};

/** Time-scoped condition for dynamic search rules. */
export type DynamicSearchRuleTimeCondition = {
  scope: "time";
  start?: string | null;
  end?: string | null;
};

/** Condition discriminated by scope. */
export type DynamicSearchRuleCondition =
  | DynamicSearchRuleQueryCondition
  | DynamicSearchRuleTimeCondition;

/** Dynamic search rule representation. */
export type DynamicSearchRule = {
  uid: string;
  description?: string | null;
  priority?: number | null;
  active?: boolean;
  conditions?: DynamicSearchRuleCondition[];
  actions: DynamicSearchRuleRuleAction[];
};

/** Partial update payload for a dynamic search rule. */
export type DynamicSearchRuleUpdate = {
  description?: string | null;
  priority?: number | null;
  active?: boolean | null;
  conditions?: DynamicSearchRuleCondition[] | null;
  actions?: DynamicSearchRuleRuleAction[] | null;
};
