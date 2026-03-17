export function objectKeys<T extends string>(o: { [TKey in T]: null }): T[] {
  return Object.keys(o) as T[];
}

// oxlint-disable-next-line no-explicit-any
export const objectEntries = Object.entries as <T extends Record<string, any>>(
  o: T,
) => [key: keyof T, val: T[keyof T]][];
