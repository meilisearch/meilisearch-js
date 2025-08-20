import { beforeAll, describe, expect, test } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import type { Embedder } from "../src/types/types.js";
import movies from "./fixtures/movies.json" assert { type: "json" };
import type { Meilisearch } from "../src/index.js";

const VOYAGE_API_KEY = import.meta.env.VITE_VOYAGE_API_KEY as string;

const INDEX_UID = "multi-modal-search-test";
const EMBEDDER_NAME = "multimodal";
const EMBEDDER_CONFIG = {
  source: "rest",
  url: "https://api.voyageai.com/v1/multimodalembeddings",
  apiKey: VOYAGE_API_KEY,
  dimensions: 1024,
  indexingFragments: {
    textAndPoster: {
      value: {
        content: [
          {
            type: "text",
            text: "{{q}}",
          },
          {
            type: "image_url",
            image_url: "{{media.poster}}",
          },
        ],
      },
    },
    // text: {
    //   value: {
    //     // The shape of the data here depends on the model used
    //     content: [
    //       {
    //         type: "text",
    //         text: "A movie titled {{doc.title}} whose description starts with {{doc.overview|truncatewords:20}}.",
    //       },
    //     ],
    //   },
    // },
    // poster: {
    //   value: {
    //     // The shape of the data here depends on the model used
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
    // text: {
    //   value: {
    //     content: [
    //       {
    //         type: "text",
    //         // uses the `q` field from search queries
    //         text: "{{q}}",
    //       },
    //     ],
    //   },
    // },
    textAndPoster: {
      value: {
        content: [
          {
            type: "text",
            text: "{{q}}",
          },
          {
            type: "image_url",
            image_url: "{{media.poster}}",
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

describe.skipIf(!VOYAGE_API_KEY)("Multi-modal search", () => {
  let searchClient: Meilisearch;

  beforeAll(async () => {
    const client = await getClient("Admin");
    await client.updateExperimentalFeatures({
      multimodal: true,
    });
    await client.createIndex(INDEX_UID).waitTask();
    await client.index(INDEX_UID).updateSettings({
      searchableAttributes: ["title", "overview"],
      embedders: {
        [EMBEDDER_NAME]: EMBEDDER_CONFIG,
      },
    });
    await client.index(INDEX_UID).addDocuments(movies).waitTask();
    searchClient = await getClient("Search");
  });

  test("should work with text query", async () => {
    const response = await searchClient
      .index(INDEX_UID)
      .search("A movie with lightsabers in space", {
        hybrid: {
          embedder: EMBEDDER_NAME,
          semanticRatio: 1,
        },
      });
    expect(response.hits[0].title).toBe("Star Wars");
  });

  test("should work with image query", async () => {
    const theFifthElementPoster = movies[3].poster;

    const response = await searchClient.index(INDEX_UID).search(null, {
      media: {
        poster: theFifthElementPoster,
      },
      hybrid: {
        embedder: EMBEDDER_NAME,
        semanticRatio: 1,
      },
    });
    expect(response.hits[0].title).toBe("The Fifth Element");
  });

  test("should work with text and image query", async () => {
    const spaceImageUrl =
      "https://science.nasa.gov/wp-content/uploads/2023/06/webb-flickr-52259221868-30e1c78f0c-4k-jpg.webp";
    const response = await searchClient.index(INDEX_UID).search(null, {
      q: "A futuristic movie",
      media: {
        poster: spaceImageUrl,
      },
      hybrid: {
        embedder: EMBEDDER_NAME,
        semanticRatio: 1,
      },
    });
    expect(response.hits[0].title).toBe("Star Wars");
  });
});
