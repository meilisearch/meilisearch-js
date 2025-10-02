import { beforeAll, describe, expect, test } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";
import type { EmbeddingSettings } from "../src/types/settings.js";
import movies from "./fixtures/movies.json" assert { type: "json" };
import type { Meilisearch } from "../src/index.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const VOYAGE_API_KEY = import.meta.env.VITE_VOYAGE_API_KEY as string;

// Helper function to load image file and return base64 string
function loadImageAsBase64(fileName: string): string {
  const imagePath = join(
    dirname(fileURLToPath(import.meta.url)),
    "fixtures",
    fileName,
  );
  const imageBuffer = readFileSync(imagePath);
  return imageBuffer.toString("base64");
}

const INDEX_UID = "multi-modal-search-test";
const EMBEDDER_NAME = "multimodal";
const EMBEDDER_CONFIG = {
  source: "rest",
  url: "https://api.voyageai.com/v1/multimodalembeddings",
  apiKey: VOYAGE_API_KEY,
  dimensions: 1024,
  indexingFragments: {
    textAndPoster: {
      // the shape of the data here depends on the model used
      value: {
        content: [
          {
            type: "text",
            text: "A movie titled {{doc.title}} whose description starts with {{doc.overview|truncatewords:20}}.",
          },
          {
            type: "image_url",
            image_url: "{{doc.poster}}",
          },
        ],
      },
    },
    text: {
      value: {
        // The shape of the data here depends on the model used
        content: [
          {
            type: "text",
            text: "A movie titled {{doc.title}} whose description starts with {{doc.overview|truncatewords:20}}.",
          },
        ],
      },
    },
    poster: {
      value: {
        // The shape of the data here depends on the model used
        content: [
          {
            type: "image_url",
            image_url: "{{doc.poster}}",
          },
        ],
      },
    },
  },
  searchFragments: {
    textAndPoster: {
      value: {
        content: [
          {
            type: "text",
            text: "{{media.textAndPoster.text}}",
          },
          {
            type: "image_base64",
            image_base64:
              "data:{{media.textAndPoster.image.mime}};base64,{{media.textAndPoster.image.data}}",
          },
        ],
      },
    },
    text: {
      value: {
        content: [
          {
            type: "text",
            text: "{{media.text.text}}",
          },
        ],
      },
    },
    poster: {
      value: {
        content: [
          {
            type: "image_url",
            image_url: "{{media.poster.poster}}",
          },
        ],
      },
    },
  },
  request: {
    // This request object matches the Voyage API request object
    inputs: ["{{fragment}}", "{{..}}"],
    model: "voyage-multimodal-3",
  },
  response: {
    // This response object matches the Voyage API response object
    data: [
      {
        embedding: "{{embedding}}",
      },
      "{{..}}",
    ],
  },
} satisfies EmbeddingSettings;

describe.skipIf(!VOYAGE_API_KEY)("Multi-modal search", () => {
  let searchClient: Meilisearch;

  beforeAll(async () => {
    const client = await getClient("Admin");
    await client.updateExperimentalFeatures({
      multimodal: true,
    });
    // Delete the index if it already exists
    await client.index(INDEX_UID).delete().waitTask();
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
    const query = "A movie with lightsabers in space";
    const response = await searchClient.index(INDEX_UID).search(query, {
      media: {
        text: {
          text: query,
        },
      },
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
        poster: {
          poster: theFifthElementPoster,
        },
      },
      hybrid: {
        embedder: EMBEDDER_NAME,
        semanticRatio: 1,
      },
    });
    expect(response.hits[0].title).toBe("The Fifth Element");
  });

  test("should work with text and image query", async () => {
    const query = "a futuristic movie";
    const masterYodaBase64 = loadImageAsBase64("master-yoda.jpeg");

    const response = await searchClient.index(INDEX_UID).search(null, {
      q: query,
      media: {
        textAndPoster: {
          text: query,
          image: {
            mime: "image/jpeg",
            data: masterYodaBase64,
          },
        },
      },
      hybrid: {
        embedder: EMBEDDER_NAME,
        semanticRatio: 1,
      },
    });
    expect(response.hits[0].title).toBe("Star Wars");
  });
});
