import { assert } from "vitest";
import type { MeilisearchErrorResponse } from "../../../src/index.js";

export const errorAssertions = {
  isErrorResponse(error: MeilisearchErrorResponse) {
    assert.lengthOf(Object.keys(error), 4);
    const { message, code, type, link } = error;
    for (const val of Object.values({ message, code, type, link })) {
      assert.typeOf(val, "string");
    }
  },
};
