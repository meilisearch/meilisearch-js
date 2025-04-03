// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RecordAny = Record<string, any>;

export type NonNullKeys<T extends RecordAny, U extends keyof T = keyof T> = {
  [TKey in U]: Exclude<T[TKey], null>;
} & { [TKey in Exclude<keyof T, U>]: T[TKey] };

export type RequiredKeys<T extends RecordAny, U extends keyof T = keyof T> = {
  [TKey in U]-?: Exclude<T[TKey], null>;
} & { [TKey in Exclude<keyof T, U>]: T[TKey] };

export type CursorResults<T> = {
  results: T[];
  limit: number;
  from: number;
  next: number;
  total: number;
};

export type NonNullableDeepRecordValues<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]: T[P] extends any[]
    ? Array<NonNullableDeepRecordValues<T[P][number]>>
    : T[P] extends RecordAny
      ? NonNullableDeepRecordValues<T[P]>
      : NonNullable<T[P]>;
};
