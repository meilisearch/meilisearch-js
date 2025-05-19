import type { HttpRequests } from "./http-requests.js";
import type { HttpRequestsWithEnqueuedTaskPromise } from "./task.js";
import type {
  EnqueuedTaskPromise,
  SingleUpdatableSettings,
  RecordAny,
} from "./types/index.js";

/** Each setting property mapped to their REST method required for updates. */
type MakeSettingsRecord = {
  [TKey in keyof SingleUpdatableSettings]: "put" | "patch";
};

/** Each setting property mapped to its get, update and reset functions. */
export type SettingFns = {
  [TKey in keyof SingleUpdatableSettings as `get${Capitalize<TKey>}`]: () => Promise<
    SingleUpdatableSettings[TKey]
  >;
} & {
  [TKey in keyof SingleUpdatableSettings as `update${Capitalize<TKey>}`]: (
    body: SingleUpdatableSettings[TKey],
  ) => EnqueuedTaskPromise;
} & {
  [TKey in keyof SingleUpdatableSettings as `reset${Capitalize<TKey>}`]: () => EnqueuedTaskPromise;
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelToKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** Returns an object containing all the setting functions. */
export function makeSettingFns(
  httpRequest: HttpRequests,
  httpRequestsWithTask: HttpRequestsWithEnqueuedTaskPromise,
  basePath: string,
  opts: MakeSettingsRecord,
): SettingFns {
  const settingFns = {} as RecordAny;

  for (const [name, method] of Object.entries(opts)) {
    const uppercaseName = capitalize(name);
    const path = `${basePath}/${camelToKebabCase(name)}`;

    settingFns[`get${uppercaseName}`] = async function (): Promise<
      SingleUpdatableSettings[keyof typeof opts]
    > {
      return await httpRequest.get({ path });
    };

    settingFns[`update${uppercaseName}`] = function (
      body: SingleUpdatableSettings[keyof typeof opts],
    ): EnqueuedTaskPromise {
      return httpRequestsWithTask[method]({ path, body });
    };

    settingFns[`reset${uppercaseName}`] = function (): EnqueuedTaskPromise {
      return httpRequestsWithTask.delete({ path });
    };
  }

  return settingFns as SettingFns;
}
