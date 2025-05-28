import type { RecordAny } from "./types.js";

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

// taken from https://stackoverflow.com/a/65642944
export type PascalToCamelCase<S extends string> = Uncapitalize<S>;

export type SafeOmit<T, K extends keyof T> = Omit<T, K>;

export type OptionStarOr<T> = "*" | T | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OptionStarOrList<T extends any[]> = ["*"] | T | null;
