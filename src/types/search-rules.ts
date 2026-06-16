export type SearchRuleListFilterPayload = {
  attributePatterns?: string[] | null;
  active?: boolean | null;
};

export type SearchRuleListPayload = {
  offset?: number;
  limit?: number;
  filter?: SearchRuleListFilterPayload | null;
};

export type SearchRuleSelector = {
  indexUid?: string | null;
  id?: string | null;
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
  scope: "query";
  isEmpty?: boolean | null;
  contains?: string | null;
};

export type SearchRuleTimeCondition = {
  scope: "time";
  start?: string | null;
  end?: string | null;
};

export type SearchRuleCondition =
  | SearchRuleQueryCondition
  | SearchRuleTimeCondition;

/** Dynamic search rule object */
export type SearchRule = {
  uid: string;
  description?: string | null;
  priority?: number | null;
  active?: boolean;
  conditions?: SearchRuleCondition[];
  actions: SearchRuleAction[];
};

/** Partial update payload for a dynamic search rule */
export type SearchRuleUpdatePayload = {
  description?: string | null;
  priority?: number | null;
  active?: boolean | null;
  conditions?: SearchRuleCondition[] | null;
  actions?: SearchRuleAction[] | null;
};
