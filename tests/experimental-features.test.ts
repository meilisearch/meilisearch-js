import { afterAll, test } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";
import type { RuntimeTogglableFeatures } from "../src/index.js";

const ms = await getClient("Master");

afterAll(async () => {
  await ms.updateExperimentalFeatures({
    chatCompletions: false,
    compositeEmbedders: false,
    containsFilter: false,
    editDocumentsByFunction: false,
    getTaskDocumentsRoute: false,
    logsRoute: false,
    metrics: false,
    multimodal: false,
    network: false,
  } satisfies { [TKey in keyof RuntimeTogglableFeatures]-?: false });
});

test(`${ms.updateExperimentalFeatures.name} and ${ms.getExperimentalFeatures.name} methods`, async () => {
  const features: { [TKey in keyof RuntimeTogglableFeatures]-?: true } = {
    chatCompletions: true,
    compositeEmbedders: true,
    containsFilter: true,
    editDocumentsByFunction: true,
    getTaskDocumentsRoute: true,
    logsRoute: true,
    metrics: true,
    multimodal: true,
    network: true,
  };

  const updateFeatures = await ms.updateExperimentalFeatures(features);
  assert.deepEqual(updateFeatures, features);

  const getFeatures = await ms.getExperimentalFeatures();
  assert.deepEqual(getFeatures, features);
});
