import { afterAll, beforeAll, expect, test, describe } from "vitest";
import {
  ErrorStatusCode,
  type RenderTemplateParams,
} from "../src/types/index.js";
import { getClient } from "./utils/meilisearch-test-utils.js";

const renderTemplateParams = {
  template: {
    kind: "inlineDocumentTemplate",
    inline: "An inline document template rendered on {{doc.id}}",
  },
  input: {
    kind: "inlineDocument",
    inline: { id: "this document" },
  },
} satisfies RenderTemplateParams;

beforeAll(async () => {
  const client = await getClient("Master");
  await client.updateExperimentalFeatures({ renderRoute: true });
});

afterAll(async () => {
  const client = await getClient("Master");
  await client.updateExperimentalFeatures({ renderRoute: false });
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on render template",
  ({ permission }) => {
    test(`${permission} key: Render an inline document template`, async () => {
      const client = await getClient(permission);

      const response = await client.renderTemplate(renderTemplateParams);

      expect(response).toHaveProperty("template");
      expect(response).toHaveProperty("rendered");
      expect(response.rendered).toStrictEqual(
        "An inline document template rendered on this document",
      );
    });
  },
);

describe.each([
  { permission: "Search", errorCode: ErrorStatusCode.INVALID_API_KEY },
  { permission: "No", errorCode: ErrorStatusCode.MISSING_AUTHORIZATION_HEADER },
])("Test on render template", ({ permission, errorCode }) => {
  test(`${permission} key: try to render a template and be denied`, async () => {
    const client = await getClient(permission);
    await expect(
      client.renderTemplate(renderTemplateParams),
    ).rejects.toHaveProperty("cause.code", errorCode);
  });
});
