import type { RecordAny } from "./types.js";

export type NonNullableDeepRecordValues<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]: T[P] extends any[]
    ? Array<NonNullableDeepRecordValues<T[P][number]>>
    : T[P] extends RecordAny
      ? NonNullableDeepRecordValues<T[P]>
      : NonNullable<T[P]>;
};
