import { afterAll, test } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";
import type { RuntimeTogglableFeatures } from "../src/index.js";

const ms = await getClient("Master");

afterAll(async () => {
  await ms.updateExperimentalFeatures({
    metrics: false,
    logsRoute: false,
    editDocumentsByFunction: false,
    containsFilter: false,
    network: false,
    getTaskDocumentsRoute: false,
    compositeEmbedders: false,
  } satisfies { [TKey in keyof RuntimeTogglableFeatures]-?: false });
});

test(`${ms.updateExperimentalFeatures.name} and ${ms.getExperimentalFeatures.name} methods`, async () => {
  const features: { [TKey in keyof RuntimeTogglableFeatures]-?: true } = {
    metrics: true,
    logsRoute: true,
    editDocumentsByFunction: true,
    containsFilter: true,
    network: true,
    getTaskDocumentsRoute: true,
    compositeEmbedders: true,
  };

  const updateFeatures = await ms.updateExperimentalFeatures(features);
  assert.deepEqual(updateFeatures, features);

  const getFeatures = await ms.getExperimentalFeatures();
  assert.deepEqual(getFeatures, features);
});
