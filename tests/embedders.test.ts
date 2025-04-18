import { afterAll, expect, test, describe, beforeEach } from "vitest";
import type { Embedders } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  getKey,
  HOST,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on embedders",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient(permission);

      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: Get default embedders`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({});
    });

    test(`${permission} key: Update embedders with 'userProvided' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "userProvided",
          dimensions: 1,
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
          binaryQuantized: false,
        },
      };
      await client.index(index.uid).updateEmbedders(newEmbedder).waitTask();

      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual(newEmbedder);
      expect(response).not.toHaveProperty("documentTemplateMaxBytes");
    });

    test(`${permission} key: Update embedders with 'openAi' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "openAi",
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
      };
      await client.index(index.uid).updateEmbedders(newEmbedder).waitTask();

      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: "<yoXXXXX...",
        },
      });
    });

    test(`${permission} key: Update embedders with 'huggingFace' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "huggingFace",
          model: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
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
      };
      await client
        .index(index.uid)
        .updateEmbedders(newEmbedder)
        .waitTask({ timeout: 60_000 });

      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual(newEmbedder);
    });

    test(`${permission} key: Update embedders with 'rest' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "rest",
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
      };
      await client.index(index.uid).updateEmbedders(newEmbedder).waitTask();

      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: "<yoXXXXX...",
        },
      });
    });

    test(`${permission} key: Update embedders with 'ollama' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "ollama",
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
      };
      await client.index(index.uid).updateEmbedders(newEmbedder).waitTask();

      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: "<yoXXXXX...",
        },
      });
    });

    test(`${permission} key: Update embedders with a specific name`, async () => {
      const client = await getClient(permission);

      const newEmbedder: Embedders = {
        image: {
          source: "userProvided",
          dimensions: 512,
        },
      };
      await client.index(index.uid).updateEmbedders(newEmbedder).waitTask();

      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual(newEmbedder);
    });

    test(`${permission} key: Update embedders with composite embedder`, async () => {
      const adminKey = await getKey("Admin");

      // first enable the network endpoint.
      await fetch(`${HOST}/experimental-features`, {
        body: JSON.stringify({ compositeEmbedders: true }),
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const client = await getClient(permission);
      const embedders = {
        default: {
          source: "composite",
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
      } satisfies Embedders;

      const task = await client
        .index(index.uid)
        .updateEmbedders(embedders)
        .waitTask();
      const response: Embedders = await client.index(index.uid).getEmbedders();

      const processedTask = await client.tasks.getTask(task.uid);
      expect(processedTask.status).toEqual("succeeded");
      expect(response).toEqual(embedders);
    });

    test(`${permission} key: Reset embedders`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).resetEmbedders().waitTask();

      const response = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({});
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).getEmbedders()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateEmbedders({}),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetEmbedders(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
