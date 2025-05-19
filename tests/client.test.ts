import {
  afterAll,
  expect,
  test,
  describe,
  beforeEach,
  vi,
  type MockInstance,
  beforeAll,
} from "vitest";
import type { Health, Version, Stats } from "../src/index.js";
import { ErrorStatusCode, MeiliSearchRequestError } from "../src/index.js";
import { PACKAGE_VERSION } from "../src/package-version.js";
import {
  clearAllIndexes,
  getKey,
  getClient,
  config,
  MeiliSearch,
  BAD_HOST,
  HOST,
  assert,
} from "./utils/meilisearch-test-utils.js";

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([
  { permission: "Master" },
  { permission: "Admin" },
  { permission: "Search" },
])("Test on client instance", ({ permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config);
  });

  test(`${permission} key: Create client with api key`, async () => {
    const key = await getKey(permission);
    const client = new MeiliSearch({
      ...config,
      apiKey: key,
    });
    const health = await client.isHealthy();
    expect(health).toBe(true);
  });

  describe("Header tests", () => {
    let fetchSpy: MockInstance<typeof fetch>;

    beforeAll(() => {
      fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterAll(() => fetchSpy.mockRestore());

    test(`${permission} key: Create client with custom headers (object)`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: {
          headers: {
            "Hello-There!": "General Kenobi",
          },
        },
      });

      await client.multiSearch(
        { queries: [] },
        { headers: { "Jane-Doe": "John Doe" } },
      );

      assert.isDefined(fetchSpy.mock.lastCall);
      const [, requestInit] = fetchSpy.mock.lastCall;

      assert.isDefined(requestInit?.headers);
      assert.instanceOf(requestInit.headers, Headers);

      const headers = requestInit.headers;

      assert.strictEqual(headers.get("Hello-There!"), "General Kenobi");
      assert.strictEqual(headers.get("Jane-Doe"), "John Doe");
    });

    test(`${permission} key: Create client with custom headers (array)`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: {
          headers: [["Hello-There!", "General Kenobi"]],
        },
      });

      assert.isTrue(await client.isHealthy());

      assert.isDefined(fetchSpy.mock.lastCall);
      const [, requestInit] = fetchSpy.mock.lastCall;

      assert.isDefined(requestInit?.headers);
      assert.instanceOf(requestInit.headers, Headers);
      assert.strictEqual(
        requestInit.headers.get("Hello-There!"),
        "General Kenobi",
      );
    });

    test(`${permission} key: Create client with custom headers (Headers)`, async () => {
      const key = await getKey(permission);
      const headers = new Headers();
      headers.set("Hello-There!", "General Kenobi");
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: { headers },
      });

      assert.isTrue(await client.isHealthy());

      assert.isDefined(fetchSpy.mock.lastCall);
      const [, requestInit] = fetchSpy.mock.lastCall;

      assert.isDefined(requestInit?.headers);
      assert.instanceOf(requestInit.headers, Headers);
      assert.strictEqual(
        requestInit.headers.get("Hello-There!"),
        "General Kenobi",
      );
    });
  });

  test(`${permission} key: No double slash when on host with domain and path and trailing slash`, async () => {
    const key = await getKey(permission);
    const customHost = `${BAD_HOST}/api/`;
    const client = new MeiliSearch({
      host: customHost,
      apiKey: key,
    });

    await assert.rejects(
      client.health(),
      MeiliSearchRequestError,
      `Request to ${BAD_HOST}/api/health has failed`,
    );
  });

  test(`${permission} key: No double slash when on host with domain and path and no trailing slash`, async () => {
    const key = await getKey(permission);
    const customHost = `${BAD_HOST}/api`;
    const client = new MeiliSearch({
      host: customHost,
      apiKey: key,
    });

    await assert.rejects(
      client.health(),
      MeiliSearchRequestError,
      `Request to ${BAD_HOST}/api/health has failed`,
    );
  });

  test(`${permission} key: host with double slash should keep double slash`, async () => {
    const key = await getKey(permission);
    const customHost = `${BAD_HOST}//`;
    const client = new MeiliSearch({
      host: customHost,
      apiKey: key,
    });

    await assert.rejects(
      client.health(),
      MeiliSearchRequestError,
      `Request to ${BAD_HOST}//health has failed`,
    );
  });

  test(`${permission} key: host with one slash should not double slash`, async () => {
    const key = await getKey(permission);
    const customHost = `${BAD_HOST}/`;
    const client = new MeiliSearch({
      host: customHost,
      apiKey: key,
    });

    await assert.rejects(
      client.health(),
      MeiliSearchRequestError,
      `Request to ${BAD_HOST}/health has failed`,
    );
  });

  test(`${permission} key: bad host raise CommunicationError`, async () => {
    const client = new MeiliSearch({ host: "http://localhost:9345" });
    await assert.rejects(client.health(), MeiliSearchRequestError);
  });

  test(`${permission} key: host without HTTP should not throw Invalid URL Error`, () => {
    const strippedHost = HOST.replace("http://", "");
    expect(() => {
      new MeiliSearch({ host: strippedHost });
    }).not.toThrow("The provided host is not valid.");
  });

  test(`${permission} key: host without HTTP and port should not throw Invalid URL Error`, () => {
    const strippedHost = HOST.replace("http://", "").replace(":7700", "");
    expect(() => {
      new MeiliSearch({ host: strippedHost });
    }).not.toThrow("The provided host is not valid.");
  });

  test(`${permission} key: Empty string host should throw an error`, () => {
    expect(() => {
      new MeiliSearch({ host: "" });
    }).toThrow("The provided host is not valid");
  });
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on client w/ master and admin key",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    test(`${permission} key: Create client with custom headers`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: {
          headers: {
            "Hello-There!": "General Kenobi",
          },
        },
      });
      expect(client.config.requestInit?.headers).toStrictEqual({
        "Hello-There!": "General Kenobi",
      });
      const health = await client.isHealthy();

      expect(health).toBe(true);

      await client.createIndex({ uid: "test" }).waitTask();

      const { results } = await client.getIndexes();

      expect(results.length).toBe(1);
    });

    test(`${permission} key: Create client with custom http client`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        async httpClient(...params: Parameters<typeof fetch>) {
          const result = await fetch(...params);
          return result.json() as Promise<unknown>;
        },
      });
      const health = await client.isHealthy();

      expect(health).toBe(true);

      await client.createIndex({ uid: "test" }).waitTask();

      const { results } = await client.getIndexes();

      expect(results.length).toBe(1);

      const index = client.index("test");

      await index.addDocuments([{ id: 1, title: "index_2" }]).waitTask();

      const { results: documents } = await index.getDocuments();
      expect(documents.length).toBe(1);
    });

    describe("Header tests", () => {
      let fetchSpy: MockInstance<typeof fetch>;

      beforeAll(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch");
      });

      afterAll(() => fetchSpy.mockRestore());

      test(`${permission} key: Create client with no custom client agents`, async () => {
        const key = await getKey(permission);
        const client = new MeiliSearch({
          ...config,
          apiKey: key,
          requestInit: {
            headers: {},
          },
        });

        assert.isTrue(await client.isHealthy());

        assert.isDefined(fetchSpy.mock.lastCall);
        const [, requestInit] = fetchSpy.mock.lastCall;

        assert.isDefined(requestInit?.headers);
        assert.instanceOf(requestInit.headers, Headers);
        assert.strictEqual(
          requestInit.headers.get("X-Meilisearch-Client"),
          `Meilisearch JavaScript (v${PACKAGE_VERSION})`,
        );
      });

      test(`${permission} key: Create client with empty custom client agents`, async () => {
        const key = await getKey(permission);
        const client = new MeiliSearch({
          ...config,
          apiKey: key,
          clientAgents: [],
        });

        assert.isTrue(await client.isHealthy());

        assert.isDefined(fetchSpy.mock.lastCall);
        const [, requestInit] = fetchSpy.mock.lastCall;

        assert.isDefined(requestInit?.headers);
        assert.instanceOf(requestInit.headers, Headers);
        assert.strictEqual(
          requestInit.headers.get("X-Meilisearch-Client"),
          `Meilisearch JavaScript (v${PACKAGE_VERSION})`,
        );
      });

      test(`${permission} key: Create client with custom client agents`, async () => {
        const key = await getKey(permission);
        const client = new MeiliSearch({
          ...config,
          apiKey: key,
          clientAgents: ["random plugin 1", "random plugin 2"],
        });

        assert.isTrue(await client.isHealthy());

        assert.isDefined(fetchSpy.mock.lastCall);
        const [, requestInit] = fetchSpy.mock.lastCall;

        assert.isDefined(requestInit?.headers);
        assert.instanceOf(requestInit.headers, Headers);
        assert.strictEqual(
          requestInit.headers.get("X-Meilisearch-Client"),
          `random plugin 1 ; random plugin 2 ; Meilisearch JavaScript (v${PACKAGE_VERSION})`,
        );
      });
    });

    describe("Test on base routes", () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission);
        const response: Health = await client.health();
        expect(response).toHaveProperty(
          "status",
          expect.stringMatching("available"),
        );
      });

      test(`${permission} key: is server healthy`, async () => {
        const client = await getClient(permission);
        const response: boolean = await client.isHealthy();
        expect(response).toBe(true);
      });

      test(`${permission} key: is healthy return false on bad host`, async () => {
        const client = new MeiliSearch({ host: "http://localhost:9345" });
        const response: boolean = await client.isHealthy();
        expect(response).toBe(false);
      });

      test(`${permission} key: get version`, async () => {
        const client = await getClient(permission);
        const response: Version = await client.getVersion();
        expect(response).toHaveProperty("commitSha", expect.any(String));
        expect(response).toHaveProperty("commitDate", expect.any(String));
        expect(response).toHaveProperty("pkgVersion", expect.any(String));
      });

      test(`${permission} key: get /stats information`, async () => {
        const client = await getClient(permission);
        const response: Stats = await client.getStats();
        expect(response).toHaveProperty("databaseSize", expect.any(Number));
        expect(response).toHaveProperty("usedDatabaseSize", expect.any(Number));
        expect(response).toHaveProperty("lastUpdate"); // TODO: Could be null, find out why
        expect(response).toHaveProperty("indexes", expect.any(Object));
      });
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on misc client methods w/ search apikey",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    describe("Test on misc client methods", () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission);
        const response: Health = await client.health();
        expect(response).toHaveProperty(
          "status",
          expect.stringMatching("available"),
        );
      });

      test(`${permission} key: try to get version and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getVersion()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_API_KEY,
        );
      });

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getStats()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_API_KEY,
        );
      });
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on misc client methods w/ no apiKey client",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    describe("Test on misc client methods", () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission);
        const response: Health = await client.health();
        expect(response).toHaveProperty(
          "status",
          expect.stringMatching("available"),
        );
      });

      test(`${permission} key: try to get version and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getVersion()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getStats()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getKeys route`, async () => {
    const route = `keys`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getKeys()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`health route`, async () => {
    const route = `health`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.health()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`stats route`, async () => {
    const route = `stats`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getStats()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`version route`, async () => {
    const route = `version`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getVersion()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});

describe.each([{ permission: "Master" }])(
  "Test network methods",
  ({ permission }) => {
    const instanceName = "instance_1";

    test(`${permission} key: Update and get network settings`, async () => {
      const client = await getClient(permission);

      const instances = {
        [instanceName]: {
          url: "http://instance-1:7700",
          searchApiKey: "search-key-1",
        },
      };

      await client.updateNetwork({ self: instanceName, remotes: instances });
      const response = await client.getNetwork();
      expect(response).toHaveProperty("self", instanceName);
      expect(response).toHaveProperty("remotes");
      expect(response.remotes).toHaveProperty("instance_1");
      expect(response.remotes["instance_1"]).toHaveProperty(
        "url",
        instances[instanceName].url,
      );
      expect(response.remotes["instance_1"]).toHaveProperty(
        "searchApiKey",
        instances[instanceName].searchApiKey,
      );
    });
  },
);
