// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RecordAny = Record<string, any>;

export type NonNullKeys<T extends RecordAny, U extends keyof T = keyof T> = {
  [TKey in U]: Exclude<T[TKey], null>;
} & { [TKey in Exclude<keyof T, U>]: T[TKey] };

export type RequiredKeys<T extends RecordAny, U extends keyof T> = {
  [TKey in U]-?: Exclude<T[TKey], null>;
} & Omit<T, U>;

export type CursorResults<T> = {
  results: T[];
  limit: number;
  from: number;
  next: number;
  total: number;
};

// taken from https://stackoverflow.com/a/65642944
export type PascalToCamelCase<S extends string> = Uncapitalize<S>;

export type DeepStringRecord<T> = {
  [TKey in keyof T]: T[TKey] extends object
    ? DeepStringRecord<T[TKey]>
    : string;
};

export type SafeOmit<T, K extends keyof T> = Omit<T, K>;
