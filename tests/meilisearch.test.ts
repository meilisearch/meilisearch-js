import {
  afterAll,
  beforeAll,
  describe,
  test,
  vi,
  type MockInstance,
} from "vitest";
import {
  MeiliSearch,
  MeiliSearchRequestTimeOutError,
  MeiliSearchRequestError,
} from "../src/index.js";
import { assert, HOST } from "./utils/meilisearch-test-utils.js";

describe("abort", () => {
  let spy: MockInstance<typeof fetch>;
  beforeAll(() => {
    spy = vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      assert.isDefined(init);
      const signal = init.signal;
      assert.isDefined(signal);
      assert.isNotNull(signal);

      return new Promise((_resolve, reject) => {
        if (signal.aborted) {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(signal.reason as unknown);
        }

        signal.onabort = function () {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(signal.reason);
          signal.removeEventListener("abort", this.onabort!);
        };
      });
    });
  });

  afterAll(() => {
    spy.mockReset();
  });

  test.concurrent("with global timeout", async () => {
    const timeout = 1;
    const ms = new MeiliSearch({ host: HOST, timeout });

    const { cause } = await assert.rejects(
      ms.health(),
      MeiliSearchRequestError,
    );
    assert.instanceOf(cause, MeiliSearchRequestTimeOutError);
    assert.strictEqual(cause.cause.timeout, timeout);
  });

  test.concurrent("with signal", async () => {
    const ms = new MeiliSearch({ host: HOST });
    const reason = Symbol("<reason>");

    const { cause } = await assert.rejects(
      ms.multiSearch({ queries: [] }, { signal: AbortSignal.abort(reason) }),
      MeiliSearchRequestError,
    );
    assert.strictEqual(cause, reason);
  });

  test.concurrent("with signal with a timeout", async () => {
    const ms = new MeiliSearch({ host: HOST });

    const { cause } = await assert.rejects(
      ms.multiSearch({ queries: [] }, { signal: AbortSignal.timeout(5) }),
      MeiliSearchRequestError,
    );

    assert.strictEqual(
      String(cause),
      "TimeoutError: The operation was aborted due to timeout",
    );
  });

  test.concurrent.for([
    [2, 1],
    [1, 2],
  ] as const)(
    "with global timeout of %ims and signal timeout of %ims",
    async ([timeout, signalTimeout]) => {
      const ms = new MeiliSearch({ host: HOST, timeout });

      const { cause } = await assert.rejects(
        ms.multiSearch(
          { queries: [] },
          { signal: AbortSignal.timeout(signalTimeout) },
        ),
        MeiliSearchRequestError,
      );

      if (timeout > signalTimeout) {
        assert.strictEqual(
          String(cause),
          "TimeoutError: The operation was aborted due to timeout",
        );
      } else {
        assert.instanceOf(cause, MeiliSearchRequestTimeOutError);
        assert.strictEqual(cause.cause.timeout, timeout);
      }
    },
  );

  test.concurrent(
    "with global timeout and immediately aborted signal",
    async () => {
      const ms = new MeiliSearch({ host: HOST, timeout: 1 });
      const reason = Symbol("<reason>");

      const { cause } = await assert.rejects(
        ms.multiSearch({ queries: [] }, { signal: AbortSignal.abort(reason) }),
        MeiliSearchRequestError,
      );

      assert.strictEqual(cause, reason);
    },
  );
});

test("headers with API key, clientAgents, global headers, and custom headers", async () => {
  const spy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(() => Promise.resolve(new Response()));

  const apiKey = "secrète";
  const clientAgents = ["TEST"];
  const globalHeaders = { my: "feather", not: "helper", extra: "header" };

  const ms = new MeiliSearch({
    host: HOST,
    apiKey,
    clientAgents,
    requestInit: { headers: globalHeaders },
  });

  const customHeaders = { my: "header", not: "yours" };
  await ms.multiSearch({ queries: [] }, { headers: customHeaders });

  const { calls } = spy.mock;
  assert.lengthOf(calls, 1);

  const headers = calls[0][1]?.headers;
  assert.isDefined(headers);
  assert.instanceOf(headers, Headers);

  const xMeilisearchClientKey = "x-meilisearch-client";
  const xMeilisearchClient = headers.get(xMeilisearchClientKey);
  headers.delete(xMeilisearchClientKey);

  assert.isNotNull(xMeilisearchClient);
  assert.sameMembers(
    xMeilisearchClient.split(" ; ").slice(0, -1),
    clientAgents,
  );

  const authorizationKey = "authorization";
  const authorization = headers.get(authorizationKey);
  headers.delete(authorizationKey);

  assert.strictEqual(authorization, `Bearer ${apiKey}`);

  // note how they overwrite eachother, top priority being the custom headers
  assert.deepEqual(Object.fromEntries(headers.entries()), {
    "content-type": "application/json",
    ...globalHeaders,
    ...customHeaders,
  });

  spy.mockReset();
});

test.concurrent("custom http client", async () => {
  const httpClient = vi.fn((..._params: Parameters<typeof fetch>) =>
    Promise.resolve(new Response()),
  );

  const ms = new MeiliSearch({ host: HOST, httpClient });
  await ms.health();

  assert.lengthOf(httpClient.mock.calls, 1);
  const input = httpClient.mock.calls[0][0];

  assert.instanceOf(input, URL);
  assert(input.href.startsWith(HOST));
});

// TODO: Describe how this PR depends on improve indexes PR
// TODO: Error tests
