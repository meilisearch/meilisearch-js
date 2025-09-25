import { randomUUID } from "node:crypto";
import { test, describe, afterAll, beforeAll } from "vitest";
import type {
  EnqueuedTaskPromise,
  FacetValuesSort,
  Setting,
  PrefixSearchSettings,
  ProximityPrecisionView,
  RankingRuleView,
  EmbedderSource,
  UpdatableSettings,
  VectorStoreBackend,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Task,
} from "../src/index.js";
import {
  assert,
  getClient,
  objectKeys,
} from "./utils/meilisearch-test-utils.js";

const INDEX_UID = randomUUID();
const ms = await getClient("Master");
const index = ms.index(INDEX_UID);

type InputAndAssertion<T extends keyof Setting> = {
  input: Setting[T];
  assertion: (input: Setting[T], output: Setting[T]) => void;
};

type MappedSettings = {
  [TKey in keyof Setting]: [
    inputAndAssertion: InputAndAssertion<TKey>,
    text?: string | undefined,
  ][];
};

/**
 * Each setting mapped to an array of {@link InputAndAssertion}, which will have
 * the following happen:
 *
 * 1. Feeds {@link InputAndAssertion.input} to `update` method and then feeds this
 *    input and the resulting {@link Task.details} setting value as output to
 *    {@link InputAndAssertion.assertion} to do any necessary assertions on the
 *    two values.
 * 2. Calls the setting `get` method and feeds it as output to the aforementioned
 *    assertion method together with the input for the same reason.
 * 3. Does the same things with the global consolidated settings method.
 */
const mappedSettings = {
  displayedAttributes: [
    [
      {
        input: ["augustus", "nero"],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  searchableAttributes: [
    [
      {
        input: ["charlemagne", "ferdinand"],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  filterableAttributes: [
    [
      {
        input: [
          "modèleZéro",
          {
            attributePatterns: ["modèleUn", "modèleDeux"],
            features: {
              facetSearch: true,
              filter: { equality: true, comparison: true },
            },
          },
        ],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameDeepMembers(input, output);
        },
      },
    ],
  ],

  sortableAttributes: [
    [
      {
        input: ["madsMikkelsen", "nikolajCosterWaldau"],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  rankingRules: [
    [
      {
        input: objectKeys<RankingRuleView>({
          words: null,
          typo: null,
          proximity: null,
          attribute: null,
          sort: null,
          exactness: null,
          "some_field:asc": null,
          "some_other_field:desc": null,
        }),
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  stopWords: [
    [
      {
        input: ["hideakiAnno", "hayaoMiyazaki"],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  nonSeparatorTokens: [
    [
      {
        input: ["nile", "amazonRiver"],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  separatorTokens: [
    [
      {
        input: ["once", "doce"],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  dictionary: [
    [
      {
        input: ["mountEverest", "k2"],
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);
          assert.sameMembers(input, output);
        },
      },
    ],
  ],

  synonyms: [
    [
      {
        input: {
          language: ["speech", "tongue", "lingo"],
          land: ["country", "nation", "state"],
        },
        assertion: (input, output) => {
          assert.deepEqual(input, output);
        },
      },
    ],
  ],

  distinctAttribute: [
    [
      {
        input: "benjaminFranklin",
        assertion: (input, output) => {
          assert.strictEqual(input, output);
        },
      },
    ],
  ],

  proximityPrecision: objectKeys<ProximityPrecisionView>({
    byWord: null,
    byAttribute: null,
  }).map((v) => [
    {
      input: v,
      assertion: (input, output) => {
        assert.strictEqual(input, output);
      },
    },
    v,
  ]),

  typoTolerance: [
    [
      {
        input: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 2, twoTypos: 3 },
          disableOnNumbers: true,
          disableOnWords: ["mot-un", "mot-deux"],
          disableOnAttributes: ["attributUn", "attributDeux"],
        },
        assertion: (input, output) => {
          assert.isNotNull(input);
          assert.isNotNull(output);

          const {
            disableOnWords: dow1,
            disableOnAttributes: doa1,
            ...restInput
          } = input;
          const {
            disableOnWords: dow2,
            disableOnAttributes: doa2,
            ...restOutput
          } = output;

          assert(dow1 != null && dow2 != null && doa1 != null && doa2 != null);

          assert.sameMembers(dow1, dow2);
          assert.sameMembers(doa1, doa2);

          assert.deepEqual(restInput, restOutput);
        },
      },
    ],
  ],

  faceting: objectKeys<FacetValuesSort>({
    alpha: null,
    count: null,
  }).map((v) => [
    {
      input: { maxValuesPerFacet: 42, sortFacetValuesBy: { random_field: v } },
      assertion: (input, output) => {
        assert.isNotNull(input);
        assert.isNotNull(output);

        assert(output.sortFacetValuesBy != null);
        const star = output.sortFacetValuesBy["*"];
        delete output.sortFacetValuesBy["*"];
        assert.oneOf(star, ["alpha", undefined]);

        assert.deepEqual(input, output);
      },
    },
    `${v} facet value sort`,
  ]),

  pagination: [
    [
      {
        input: { maxTotalHits: 42 },
        assertion: (input, output) => {
          assert.deepEqual(input, output);
        },
      },
    ],
  ],

  embedders: objectKeys<EmbedderSource>({
    openAi: null,
    huggingFace: null,
    ollama: null,
    userProvided: null,
    rest: null,
    composite: null,
  }).map((source) => {
    return [
      {
        input: {
          [source]: (() => {
            switch (source) {
              case "openAi":
                return {
                  source,
                  apiKey: "<your-OpenAI-API-key>",
                  model: "text-embedding-3-small",
                  documentTemplate:
                    "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
                  dimensions: 1536,
                  distribution: { mean: 0.7, sigma: 0.3 },
                  url: "https://api.openai.com/v1/embeddings",
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                };
              case "huggingFace":
                return {
                  source,
                  model:
                    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                  documentTemplate:
                    "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
                  distribution: { mean: 0.7, sigma: 0.3 },
                  pooling: "useModel",
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                };
              case "ollama":
                return {
                  source,
                  url: "http://localhost:11434/api/embeddings",
                  apiKey: "<your-ollama-api-key>",
                  model: "nomic-embed-text",
                  documentTemplate: "blabla",
                  distribution: { mean: 0.7, sigma: 0.3 },
                  dimensions: 512,
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                };
              case "userProvided":
                return {
                  source,
                  dimensions: 1,
                  distribution: { mean: 0.7, sigma: 0.3 },
                  binaryQuantized: false,
                };
              case "rest":
                return {
                  source,
                  url: "https://api.openai.com/v1/embeddings",
                  apiKey: "<your-openai-api-key>",
                  dimensions: 1536,
                  documentTemplate:
                    "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
                  distribution: { mean: 0.7, sigma: 0.3 },
                  request: {
                    model: "text-embedding-3-small",
                    input: ["{{text}}", "{{..}}"],
                  },
                  response: {
                    data: [{ embedding: "{{embedding}}" }, "{{..}}"],
                  },
                  headers: { "Custom-Header": "CustomValue" },
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                };
              case "composite":
                return {
                  source,
                  searchEmbedder: {
                    source: "huggingFace",
                    model:
                      "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                    pooling: "useModel",
                  },
                  indexingEmbedder: {
                    source: "huggingFace",
                    model:
                      "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                    documentTemplate: "{{doc.title}}",
                    pooling: "useModel",
                    documentTemplateMaxBytes: 500,
                  },
                };
            }
          })(),
        },
        assertion: (input, output) => {
          const inputEmbeddingSettings = input?.[source];
          const outputEmbeddingSettings = output?.[source];
          assert(
            inputEmbeddingSettings != null && outputEmbeddingSettings != null,
          );

          const { apiKey: inputApiKey, ...restOfInputEmbeddingSettings } =
            inputEmbeddingSettings;
          const { apiKey: outputApiKey, ...restOfOutputEmbeddingSettings } =
            outputEmbeddingSettings;

          assert.deepEqual(
            restOfInputEmbeddingSettings,
            restOfOutputEmbeddingSettings,
          );
          assert(typeof inputApiKey === typeof outputApiKey);
        },
      },
      source,
    ];
  }),

  searchCutoffMs: [
    [
      {
        input: 100,
        assertion: (input, output) => {
          assert.strictEqual(input, output);
        },
      },
    ],
  ],

  localizedAttributes: [
    [
      {
        input: [{ attributePatterns: ["title"], locales: ["eng"] }],
        assertion: (input, output) => {
          assert.deepEqual(input, output);
        },
      },
    ],
  ],

  facetSearch: [
    [
      {
        input: true,
        assertion: (input, output) => {
          assert.strictEqual(input, output);
        },
      },
    ],
  ],

  prefixSearch: objectKeys<PrefixSearchSettings>({
    indexingTime: null,
    disabled: null,
  }).map((v) => [
    {
      input: v,
      assertion: (input, output) => {
        assert.strictEqual(input, output);
      },
    },
    v,
  ]),

  chat: [
    [
      {
        input: {
          description:
            "A comprehensive movie database containing titles, overviews, genres, and release dates to help users find movies",
          documentTemplate:
            "Title: {{ title }}\nDescription: {{ overview }}\nGenres: {{ genres }}\nRelease Date: {{ release_date }}\n",
          documentTemplateMaxBytes: 500,
          searchParameters: {
            hybrid: { embedder: "default", semanticRatio: 0.5 },
            limit: 20,
            sort: ["release_date:desc"],
            distinct: "title",
            matchingStrategy: "last",
            attributesToSearchOn: ["title", "overview"],
            rankingScoreThreshold: 0.5,
          },
        },
        assertion: (input, output) => {
          assert.deepEqual(input, output);
        },
      },
    ],
  ],

  vectorStore: objectKeys<VectorStoreBackend>({
    stable: null,
    experimental: null,
  }).map((v) => [
    {
      input: v,
      assertion: (input, output) => {
        assert.strictEqual(input, output);
      },
    },
    v,
  ]),
} satisfies MappedSettings as Record<
  string,
  [
    inputAndAssertion: InputAndAssertion<keyof Setting>,
    text?: string | undefined,
  ][]
>;

beforeAll(async () => {
  await ms.updateExperimentalFeatures({
    compositeEmbedders: true,
    chatCompletions: true,
    vectorStoreSetting: true,
  });
  const task = await ms.createIndex(INDEX_UID).waitTask();
  assert.isTaskSuccessful(task);
});

afterAll(async () => {
  const task = await index.delete().waitTask();
  assert.isTaskSuccessful(task);
  await ms.updateExperimentalFeatures({
    compositeEmbedders: false,
    chatCompletions: false,
    vectorStoreSetting: false,
  });
});

describe.for(Object.entries(mappedSettings))("%s", ([key, mappedSetting]) => {
  const castKey = key as keyof MappedSettings;
  const capitalizedKey = (castKey.charAt(0).toUpperCase() +
    key.slice(1)) as Capitalize<keyof MappedSettings>;

  // Union of functions results in intersection of their parameters
  // https://github.com/microsoft/TypeScript/issues/30581

  const getSetting = index.settings[`get${capitalizedKey}`] as () => Promise<
    Setting[keyof Setting]
  >;

  const updateSetting = index.settings[`update${capitalizedKey}`] as (
    v: Setting[keyof Setting],
  ) => EnqueuedTaskPromise;

  const resetSetting = index.settings[`reset${capitalizedKey}`];

  mappedSetting = mappedSetting.map(([a, b]) => [
    a,
    b === undefined ? "" : ` with ${b}`,
  ]);

  test.for(mappedSetting)(
    "update and get methods%s",
    async ([{ input, assertion }]) => {
      const task = await updateSetting(input).waitTask({ timeout: 30_000 });
      assert.isTaskSuccessful(task);
      assert.strictEqual(task.type, "settingsUpdate");

      const taskSetting = task.details?.[castKey];
      assert.isDefined(taskSetting);
      assertion(input, taskSetting);

      const setting = await getSetting();
      assertion(input, setting);
    },
  );

  test("reset method", async () => {
    const task = await resetSetting().waitTask();
    assert.includeDeepMembers([null, ["*"]], [task.details?.[castKey]]);
    assert.isTaskSuccessful(task);
    assert.strictEqual(task.type, "settingsUpdate");
  });

  test.for(mappedSetting)(
    `${index.updateSettings.name} and ${index.getSettings.name} methods%s`,
    async ([{ input, assertion }]) => {
      const task = await index
        .updateSettings({ [castKey]: input })
        .waitTask({ timeout: 30_000 });
      assert.isTaskSuccessful(task);
      assert.strictEqual(task.type, "settingsUpdate");

      const taskSetting = task.details?.[castKey];
      assert.isDefined(taskSetting);
      assertion(input, taskSetting);

      const settings = await index.getSettings();
      assert.isDefined(settings[castKey]);
      assertion(input, settings[castKey]);
    },
  );

  test(`reset with ${index.updateSettings.name} method`, async () => {
    const task = await index.updateSettings({ [castKey]: null }).waitTask();
    assert.includeDeepMembers([null, ["*"]], [task.details?.[castKey]]);
    assert.isTaskSuccessful(task);
    assert.strictEqual(task.type, "settingsUpdate");
  });
});

test(`${index.resetSettings.name} method`, async () => {
  const task = await index.resetSettings().waitTask();

  assert.isTaskSuccessful(task);
  assert.deepEqual(task.details, {
    dictionary: null,
    displayedAttributes: ["*"],
    distinctAttribute: null,
    embedders: null,
    facetSearch: null,
    faceting: null,
    filterableAttributes: null,
    localizedAttributes: null,
    nonSeparatorTokens: null,
    pagination: null,
    prefixSearch: null,
    proximityPrecision: null,
    rankingRules: null,
    searchCutoffMs: null,
    searchableAttributes: ["*"],
    separatorTokens: null,
    sortableAttributes: null,
    stopWords: null,
    synonyms: null,
    typoTolerance: null,
    chat: null,
    vectorStore: null,
  } satisfies Required<UpdatableSettings>);
  assert.strictEqual(task.type, "settingsUpdate");
});
