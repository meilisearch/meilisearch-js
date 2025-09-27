import { assert } from "vitest";

const NOT_RESOLVED = Symbol("<not resolved>");
const RESOLVED = Symbol("<resolved>");

export const promiseAssertions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async rejects<T extends { new (...args: any[]): any }>(
    promise: Promise<unknown>,
    errorConstructor: T,
    errMsgMatcher?: RegExp | string,
  ): Promise<InstanceType<T>> {
    let resolvedValue;

    try {
      resolvedValue = await promise;
    } catch (error) {
      assert.instanceOf(error, errorConstructor);

      if (errMsgMatcher !== undefined) {
        const { message } = error as Error;
        if (typeof errMsgMatcher === "string") {
          assert.strictEqual(message, errMsgMatcher);
        } else {
          assert.match(message, errMsgMatcher);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return error as InstanceType<T>;
    }

    assert.fail(resolvedValue, NOT_RESOLVED, "expected value to not resolve");
  },

  async resolves(promise: Promise<unknown>): Promise<void> {
    try {
      await promise;
    } catch (error) {
      assert.fail(error, RESOLVED, "expected value to not reject");
    }
  },
};
