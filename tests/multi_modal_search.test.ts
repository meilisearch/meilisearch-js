import { beforeAll, describe, expect, test } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import type { Embedder } from "../src/types/types.js";
import movies from "./fixtures/movies.json" assert { type: "json" };
import type { Meilisearch } from "../src/index.js";

const INDEX_UID = "multi-modal-search-test";
const EMBEDDER_NAME = "multimodal";
const EMBEDDER_CONFIG = {
  source: "rest",
  url: "https://api.voyageai.com/v1/multimodalembeddings",
  apiKey: import.meta.env.VITE_VOYAGE_API_KEY as string,
  dimensions: 1024,
  indexingFragments: {
    text: {
      value: {
        // this part sticks to the voyage API
        // this fragment is only meant at indexing time
        content: [
          {
            type: "text",
            text: "A movie titled {{doc.title}} whose description starts with {{doc.overview|truncatewords:20}}.",
          },
        ],
      },
    },
    // we also send the poster
    // poster: {
    //   value: {
    //     content: [
    //       {
    //         type: "image_url",
    //         image_url: "{{doc.poster}}",
    //       },
    //     ],
    //   },
    // },
  },
  searchFragments: {
    // we allow sending a poster at search time
    // poster: {
    //   value: {
    //     content: [
    //       {
    //         type: "image_url",
    //         image_url: "{{media.poster}}",
    //       },
    //     ],
    //   },
    // },
    // we also allow inline image data at search time only
    // image: {
    //   value: {
    //     content: [
    //       {
    //         type: "image_base64",
    //         image_base64:
    //           "data:{{media.image.mime}};base64,{{media.image.data}}",
    //       },
    //     ],
    //   },
    // },
    text: {
      value: {
        content: [
          {
            type: "text",
            // uses the `q` field from search queries
            text: "{{q}}",
          },
        ],
      },
    },
  },
  request: {
    inputs: ["{{fragment}}", "{{..}}"],
    model: "voyage-multimodal-3",
  },
  response: {
    // Maps how Voyage API returns the embedding
    data: [
      {
        embedding: "{{embedding}}",
      },
      "{{..}}",
    ],
  },
} satisfies Embedder;

beforeAll(async () => {
  const client = await getClient("Admin");
  await client.updateExperimentalFeatures({
    multimodal: true,
  });
  await client.deleteIndex(INDEX_UID).waitTask();
  await client.createIndex(INDEX_UID).waitTask();
  await client.index(INDEX_UID).updateSettings({
    searchableAttributes: ["title", "overview"],
    embedders: {
      [EMBEDDER_NAME]: EMBEDDER_CONFIG,
    },
  });
  await client.index(INDEX_UID).addDocuments(movies);
});

describe("Multi-modal search", () => {
  let searchClient: Meilisearch;

  beforeAll(async () => {
    searchClient = await getClient("Search");
  });

  test("should search for a text", async () => {
    const results = await searchClient.index(INDEX_UID).search("", {
      q: "A movie with lightsabers in space",
      hybrid: {
        embedder: EMBEDDER_NAME,
        semanticRatio: 0.5,
      },
    });
    console.log(results);
    expect(results.hits.length).toBe(1);
  });
});
