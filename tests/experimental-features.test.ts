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
    chatCompletions: false,
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
    chatCompletions: true,
  };

  const updateResponse = await ms.updateExperimentalFeatures(features);
  const getResponse = await ms.getExperimentalFeatures();

  for (const [feature, expectedValue] of Object.entries(features)) {
    assert.propertyVal(
      updateResponse,
      feature,
      expectedValue,
      `Failed on updateResponse for feature: ${feature}`,
    );

    assert.propertyVal(
      getResponse,
      feature,
      expectedValue,
      `Failed on getResponse for feature: ${feature}`,
    );
  }
});
