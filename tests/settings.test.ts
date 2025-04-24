import { test, describe, afterAll } from "vitest";
import type {
  EnqueuedTaskPromise,
  FacetValuesSort,
  SingleUpdatableSettings,
  PrefixSearchSettings,
  ProximityPrecisionView,
  RankingRuleView,
  EmbedderSource,
  UpdatableSettings,
} from "../src/index.js";
import {
  assert,
  getClient,
  ObjectKeys,
} from "./utils/meilisearch-test-utils.js";

const INDEX_UID = "e16993ea-0cd2-4a29-9365-b99778a92c74";
const ms = await getClient("Master");
const index = ms.index(INDEX_UID);

type InputAndAssertion<T extends keyof SingleUpdatableSettings> = {
  input: SingleUpdatableSettings[T];
  assertion: (
    input: SingleUpdatableSettings[T],
    output: SingleUpdatableSettings[T],
  ) => void;
};

type MappedSettings = {
  [TKey in keyof SingleUpdatableSettings]: [
    text: string | undefined,
    inputAndAssertion: InputAndAssertion<TKey>,
  ][];
};

const mappedSettings = {
  displayedAttributes: [
    [
      undefined,
      {
        input: ["uno", "dos"],
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
      undefined,
      {
        input: ["tres", "cuatro"],
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
      undefined,
      {
        input: [
          // pattern
          "genre",
          // granular
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
      undefined,
      {
        input: ["cinco", "seis"],
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
      undefined,
      {
        input: ObjectKeys<RankingRuleView>({
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
      undefined,
      {
        input: ["siete", "ocho"],
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
      undefined,
      {
        input: ["nueve", "diez"],
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
      undefined,
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
      undefined,
      {
        input: ["suge", "bucle"],
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
      undefined,
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
      undefined,
      {
        input: "trece",
        assertion: (input, output) => {
          assert.strictEqual(input, output);
        },
      },
    ],
  ],

  proximityPrecision: ObjectKeys<ProximityPrecisionView>({
    byWord: null,
    byAttribute: null,
  }).map((v) => [
    v,
    {
      input: v,
      assertion: (input, output) => {
        assert.strictEqual(input, output);
      },
    },
  ]),

  typoTolerance: [
    [
      undefined,
      {
        input: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 2, twoTypos: 3 },
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

          assert(dow1 != null);
          assert(dow2 != null);
          assert(doa1 != null);
          assert(doa2 != null);

          assert.sameMembers(dow1, dow2);
          assert.sameMembers(doa1, doa2);

          assert.deepEqual(restInput, restOutput);
        },
      },
    ],
  ],

  faceting: ObjectKeys<FacetValuesSort>({
    alpha: null,
    count: null,
  }).map((v) => [
    `${v} facet value sort`,
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
  ]),

  pagination: [
    [
      undefined,
      {
        input: { maxTotalHits: 42 },
        assertion: (input, output) => {
          assert.deepEqual(input, output);
        },
      },
    ],
  ],

  embedders: ObjectKeys<EmbedderSource>({
    openAi: null,
    huggingFace: null,
    ollama: null,
    userProvided: null,
    rest: null,
    composite: null,
  }).map((source) => {
    return [
      source,
      (() => {
        switch (source) {
          case "openAi":
            return {
              input: {
                default: {
                  source,
                  apiKey: "<your-OpenAI-API-key>",
                  model: "text-embedding-3-small",
                  documentTemplate:
                    "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
                  dimensions: 1536,
                  distribution: {
                    mean: 0.7,
                    sigma: 0.3,
                  },
                  url: "https://api.openai.com/v1/embeddings",
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                },
              },
              assertion: (input, output) => {
                assert.deepEqual(input, output);
              },
            };
          case "huggingFace":
            return {
              input: {
                default: {
                  source,
                  model:
                    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                  documentTemplate:
                    "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
                  distribution: {
                    mean: 0.7,
                    sigma: 0.3,
                  },
                  pooling: "useModel",
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                },
              },
              assertion: (input, output) => {
                assert.deepEqual(input, output);
              },
            };
          case "ollama":
            return {
              input: {
                default: {
                  source,
                  url: "http://localhost:11434/api/embeddings",
                  apiKey: "<your-ollama-api-key>",
                  model: "nomic-embed-text",
                  documentTemplate: "blabla",
                  distribution: {
                    mean: 0.7,
                    sigma: 0.3,
                  },
                  dimensions: 512,
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                },
              },
              assertion: (input, output) => {
                assert.deepEqual(input, output);
              },
            };
          case "userProvided":
            return {
              input: {
                default: {
                  source,
                  dimensions: 1,
                  distribution: {
                    mean: 0.7,
                    sigma: 0.3,
                  },
                  binaryQuantized: false,
                },
              },
              assertion: (input, output) => {
                assert.deepEqual(input, output);
              },
            };
          case "rest":
            return {
              input: {
                default: {
                  source,
                  url: "https://api.openai.com/v1/embeddings",
                  apiKey: "<your-openai-api-key>",
                  dimensions: 1536,
                  documentTemplate:
                    "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
                  distribution: {
                    mean: 0.7,
                    sigma: 0.3,
                  },
                  request: {
                    model: "text-embedding-3-small",
                    input: ["{{text}}", "{{..}}"],
                  },
                  response: {
                    data: [
                      {
                        embedding: "{{embedding}}",
                      },
                      "{{..}}",
                    ],
                  },
                  headers: {
                    "Custom-Header": "CustomValue",
                  },
                  documentTemplateMaxBytes: 500,
                  binaryQuantized: false,
                },
              },
              assertion: (input, output) => {
                assert.deepEqual(input, output);
              },
            };
          case "composite":
            return {
              input: {
                default: {
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
                },
              },
              assertion: (input, output) => {
                assert.deepEqual(input, output);
              },
            };
          default:
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            assert.fail(`untested source ${source}`);
        }
      })(),
    ];
  }),

  searchCutoffMs: [
    [
      undefined,
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
      undefined,
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
      undefined,
      {
        input: true,
        assertion: (input, output) => {
          assert.strictEqual(input, output);
        },
      },
    ],
  ],

  prefixSearch: ObjectKeys<PrefixSearchSettings>({
    indexingTime: null,
    disabled: null,
  }).map((v) => [
    v,
    {
      input: v,
      assertion: (input, output) => {
        assert.strictEqual(input, output);
      },
    },
  ]),
} satisfies MappedSettings as Record<
  string,
  [
    text: string | undefined,
    inputAndAssertion: InputAndAssertion<keyof SingleUpdatableSettings>,
  ][]
>;

afterAll(async () => {
  const task = await index.delete().waitTask();
  assert.isTaskSuccessful(task);
});

describe.for(Object.entries(mappedSettings))("%s", ([key, mappedSetting]) => {
  const castKey = key as keyof MappedSettings;
  const capitalizedKey = (castKey.charAt(0).toUpperCase() +
    key.slice(1)) as Capitalize<keyof MappedSettings>;

  // Union of functions results in intersection of their parameters
  // https://github.com/microsoft/TypeScript/issues/30581

  const getSetting = index.setting[`get${capitalizedKey}`].bind(
    index,
  ) as () => Promise<SingleUpdatableSettings[keyof SingleUpdatableSettings]>;

  const updateSetting = index.setting[`update${capitalizedKey}`].bind(
    index,
  ) as (
    v: SingleUpdatableSettings[keyof SingleUpdatableSettings],
  ) => EnqueuedTaskPromise;

  const resetSetting = index.setting[`reset${capitalizedKey}`].bind(index);

  mappedSetting = mappedSetting.map(([a, b]) => [
    a === undefined ? "" : ` with ${a}`,
    b,
  ]);

  test.for(mappedSetting)(
    "single update and get methods%s",
    async ([, { input, assertion }]) => {
      const task = await updateSetting(input).waitTask();
      assert.isTaskSuccessful(task);

      const taskSetting = task.details?.[castKey];
      assert.isDefined(taskSetting);
      assertion(input, taskSetting);

      const setting = await getSetting();
      assertion(input, setting);
    },
  );

  test("single reset method", async () => {
    const task = await resetSetting().waitTask();
    assert.includeDeepMembers([null, ["*"]], [task.details?.[castKey]]);
    assert.isTaskSuccessful(task);
  });

  test.for(mappedSetting)(
    `${index.updateSettings.name} and ${index.getSettings.name} methods%s`,
    async ([, { input, assertion }]) => {
      const task = await index.updateSettings({ [castKey]: input }).waitTask();
      assert.isTaskSuccessful(task);

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
  } satisfies Required<UpdatableSettings>);
});
