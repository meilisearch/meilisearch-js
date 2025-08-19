import { test, afterAll } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";
import type { Remote } from "../src/index.js";

const ms = await getClient("Master");

afterAll(async () => {
  await ms.updateNetwork({
    remotes: {
      // TODO: Better types for Network
      // @ts-expect-error This should be accepted
      soi: null,
    },
  });
});

test(`${ms.updateNetwork.name} and ${ms.getNetwork.name} method`, async () => {
  const network = {
    self: "soi",
    remotes: {
      soi: {
        url: "https://france-visas.gouv.fr/",
        searchApiKey: "hemmelighed",
      },
    },
  };

  function validateRemotes(remotes: Record<string, Remote>) {
    for (const [key, val] of Object.entries(remotes)) {
      if (key !== "soi") {
        assert.lengthOf(Object.keys(val), 2);
        assert.typeOf(val.url, "string");
        assert(
          typeof val.searchApiKey === "string" || val.searchApiKey === null,
        );
        delete remotes[key];
      }
    }
  }

  const updateResponse = await ms.updateNetwork(network);
  validateRemotes(updateResponse.remotes);
  assert.deepEqual(updateResponse, network);

  const getResponse = await ms.getNetwork();
  validateRemotes(getResponse.remotes);
  assert.deepEqual(getResponse, network);
});
