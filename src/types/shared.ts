export type CursorResults<T> = {
  results: T[];
  limit: number;
  from: number;
  next: number;
  total: number;
};

export type PascalToCamelCase<S extends string> = Uncapitalize<S>;
