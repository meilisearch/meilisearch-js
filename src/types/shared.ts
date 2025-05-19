export type CursorResults<T> = {
  results: T[];
  limit: number;
  from: number;
  next: number;
  total: number;
};

// taken from https://stackoverflow.com/a/65642944
export type PascalToCamelCase<S extends string> = Uncapitalize<S>;
