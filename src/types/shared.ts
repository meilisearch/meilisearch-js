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
