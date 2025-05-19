import { randomUUID } from "node:crypto";
import { describe, test } from "vitest";
import type {
  Action,
  CreateApiKey,
  KeyView,
  ListApiKeys,
} from "../src/index.js";
import {
  assert as extAssert,
  getClient,
  objectEntries,
  objectKeys,
} from "./utils/meilisearch-test-utils.js";

const customAssert = {
  isKeyView(value: KeyView) {
    extAssert.lengthOf(Object.keys(value), 9);
    const {
      name,
      description,
      key,
      uid,
      actions,
      indexes,
      expiresAt,
      createdAt,
      updatedAt,
    } = value;

    extAssert(
      name === null || typeof name === "string",
      "expected name to be null or string",
    );
    extAssert(
      description === null || typeof description === "string",
      "expected description to be null or string",
    );

    extAssert.typeOf(key, "string");
    extAssert.typeOf(uid, "string");

    for (const action of actions) {
      extAssert.oneOf(action, possibleActions);
    }

    for (const index of indexes) {
      extAssert.typeOf(index, "string");
    }

    extAssert(
      expiresAt === null || typeof expiresAt === "string",
      "expected expiresAt to be null or string",
    );

    extAssert.typeOf(createdAt, "string");
    extAssert.typeOf(updatedAt, "string");
  },
};

const assert: typeof extAssert & typeof customAssert = Object.assign(
  extAssert,
  customAssert,
);

const KEY_UID = randomUUID();

type TestRecord = {
  [TKey in keyof CreateApiKey]-?: [
    name: string | undefined,
    value: CreateApiKey[TKey],
    assertion: (a: CreateApiKey[TKey], b: CreateApiKey[TKey]) => void,
  ][];
};

type SimplifiedTestRecord = Record<
  keyof CreateApiKey,
  [
    name: string | undefined,
    value: CreateApiKey[keyof CreateApiKey],
    assertion: (
      a: CreateApiKey[keyof CreateApiKey],
      b: CreateApiKey[keyof CreateApiKey],
    ) => void,
  ][]
>;

const possibleActions = objectKeys<Action>({
  "*": null,
  search: null,
  "documents.*": null,
  "documents.add": null,
  "documents.get": null,
  "documents.delete": null,
  "indexes.*": null,
  "indexes.get": null,
  "indexes.delete": null,
  "indexes.create": null,
  "indexes.update": null,
  "indexes.swap": null,
  "tasks.*": null,
  "tasks.get": null,
  "tasks.delete": null,
  "tasks.cancel": null,
  "settings.*": null,
  "settings.get": null,
  "settings.update": null,
  "stats.get": null,
  "metrics.get": null,
  "dumps.create": null,
  "snapshots.create": null,
  version: null,
  "keys.get": null,
  "keys.delete": null,
  "keys.create": null,
  "keys.update": null,
  "experimental.get": null,
  "experimental.update": null,
  "network.get": null,
  "network.update": null,
});

const testRecord = {
  description: [
    [
      undefined,
      "The Skeleton Key is an unbreakable lockpick and Daedric Artifact in The Elder Scrolls IV: Oblivion.",
      (a, b) => {
        assert.strictEqual(a, b);
      },
    ],
  ],
  name: [
    [
      undefined,
      "Skeleton Key",
      (a, b) => {
        assert.strictEqual(a, b);
      },
    ],
  ],
  uid: [
    [
      undefined,
      KEY_UID,
      (a, b) => {
        assert.strictEqual(a, b);
      },
    ],
  ],
  actions: possibleActions.map((action) => [
    action,
    [action],
    (a, b) => {
      assert.sameMembers(a, b);
    },
  ]),
  indexes: [
    [
      undefined,
      ["indexEins", "indexZwei"],
      (a, b) => {
        assert.sameMembers(a, b);
      },
    ],
  ],
  expiresAt: [
    [
      undefined,
      new Date("9999-12-5").toISOString(),
      (a, b) => {
        assert.strictEqual(Date.parse(a!), Date.parse(b!));
      },
    ],
  ],
} satisfies TestRecord as SimplifiedTestRecord;

// transform names
for (const testValues of Object.values(testRecord)) {
  for (const testValue of testValues) {
    testValue[0] = testValue[0] === undefined ? "" : ` with "${testValue[0]}"`;
  }
}

const ms = await getClient("Master");

describe.for(objectEntries(testRecord))("`%s`", ([key, values]) => {
  test.for(values)(
    `${ms.createKey.name} method%s`,
    async ([, value, assertion]) => {
      const keyView = await ms.createKey({
        actions: ["*"],
        indexes: ["*"],
        expiresAt: null,
        [key]: value,
      });

      assert.isKeyView(keyView);

      assertion(keyView[key as keyof typeof keyView], value);
    },
  );
});

const pickedTestRecord = (() => {
  const { name, description } = testRecord;
  return { name, description };
})();

describe.for(objectEntries(pickedTestRecord))("`%s`", ([key, values]) => {
  test.for(values)(
    `${ms.updateKey.name} method%s`,
    async ([, value, assertion]) => {
      const keyView = await ms.updateKey(KEY_UID, { [key]: value });

      assert.isKeyView(keyView);

      assertion(keyView[key as keyof typeof keyView], value);
    },
  );
});

test(`${ms.getKeys.name}, ${ms.getKey.name} and ${ms.deleteKey.name} methods`, async () => {
  const keyList = await ms.getKeys({
    offset: 0,
    limit: 10_000,
  } satisfies Required<ListApiKeys>);

  for (const { uid, name } of keyList.results) {
    const keyView = await ms.getKey(uid);

    // avoid deleting default keys that might be used by other tests
    if (name !== "Default Search API Key" && name !== "Default Admin API Key") {
      await ms.deleteKey(uid);
    }

    assert.isKeyView(keyView);
  }

  assert.lengthOf(Object.keys(keyList), 4);
  const { results, offset, limit, total } = keyList;

  for (const keyView of results) {
    assert.isKeyView(keyView);
  }

  assert.typeOf(offset, "number");
  assert.typeOf(limit, "number");
  assert.typeOf(total, "number");
});
