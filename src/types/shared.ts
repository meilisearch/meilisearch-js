export type CursorResults<T> = {
  results: T[];
  limit: number;
  from: number;
  next: number;
  total: number;
};

export type NoNullField<T> = {
  [P in keyof T]: T[P] extends any[]
    ? Array<NoNullField<T[P][number]>>
    : T[P] extends Record<string, any>
      ? NoNullField<T[P]>
      : NonNullable<T[P]>;
};
