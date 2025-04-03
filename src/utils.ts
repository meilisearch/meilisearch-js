async function sleep(ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

function addProtocolIfNotPresent(host: string): string {
  if (!(host.startsWith("https://") || host.startsWith("http://"))) {
    return `http://${host}`;
  }
  return host;
}

function addTrailingSlash(url: string): string {
  if (!url.endsWith("/")) {
    url += "/";
  }
  return url;
}

function stringifyRecordKeyValues<
  T extends Record<string, unknown>,
  const U extends (keyof T)[],
>(v: T, keys: U) {
  return Object.fromEntries(
    Object.entries(v).map(([key, val]) => [
      key,
      keys.includes(key) ? JSON.stringify(val) : val,
    ]),
  ) as { [TKey in Exclude<keyof T, U[number]>]: T[TKey] } & {
    [TKey in U[number]]: string;
  };
}

export {
  sleep,
  addProtocolIfNotPresent,
  addTrailingSlash,
  stringifyRecordKeyValues,
};
