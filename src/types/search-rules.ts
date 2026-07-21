export type SearchRuleListFilterPayload = {
  query?: string | null;
  active?: boolean | null;
};

export type SearchRuleListPayload = {
  offset?: number;
  limit?: number;
  filter?: SearchRuleListFilterPayload | null;
};

export type SearchRuleSelector = {
  indexUid?: string | null;
  id: string;
};

export type SearchRulePinAction = {
  type: "pin";
  position: number;
};

export type SearchRuleAction = {
  selector: SearchRuleSelector;
  action: SearchRulePinAction;
};

export type SearchRuleQueryCondition = {
  isEmpty?: boolean | null;
  words?: string | null;
};

export type SearchRuleTimeCondition = {
  start?: string | null;
  end?: string | null;
};

/** Conditions that must match before the dynamic search rule applies. */
export type SearchRuleConditions = {
  query?: SearchRuleQueryCondition | null;
  time?: SearchRuleTimeCondition | null;
};

/** Dynamic search rule object */
export type SearchRule = {
  uid: string;
  description?: string | null;
  precedence?: number | null;
  active?: boolean;
  conditions?: SearchRuleConditions;
  actions: SearchRuleAction[];
};

/** Partial update payload for a dynamic search rule */
export type SearchRuleUpdatePayload = {
  description?: string | null;
  precedence?: number | null;
  active?: boolean | null;
  conditions?: SearchRuleConditions | null;
  actions?: SearchRuleAction[] | null;
};
