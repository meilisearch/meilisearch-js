import { afterAll, expect, test } from "vitest";
import {
  clearAllIndexes,
  config,
  MeiliSearch,
} from "./utils/meilisearch-test-utils.js";

afterAll(() => {
  return clearAllIndexes(config);
});

test(`Client handles host URL with domain and path`, () => {
  const customHost = `${config.host}/api/`;
  const client = new MeiliSearch({
    host: customHost,
  });
  expect(client.config.host).toBe(customHost);
  expect(client.httpRequest.url.href).toBe(customHost);
});

test(`Client handles host URL with domain and path and no trailing slash`, () => {
  const customHost = `${config.host}/api`;
  const client = new MeiliSearch({
    host: customHost,
  });
  expect(client.httpRequest.url.href).toBe(customHost + "/");
});
