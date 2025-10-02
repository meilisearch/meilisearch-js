import type { HttpRequests } from "./http-requests.js";
import type { HttpRequestsWithEnqueuedTaskPromise } from "./task.js";
import type { EnqueuedTaskPromise, Setting, RecordAny } from "./types/index.js";

/** Each setting property mapped to their REST method required for updates. */
type MakeSettingsRecord = {
  [TKey in keyof Setting]: "put" | "patch";
};

/** Each setting property mapped to its get, update and reset functions. */
export type SettingFns = {
  [TKey in keyof Setting as `get${Capitalize<TKey>}`]: () => Promise<
    Setting[TKey]
  >;
} & {
  [TKey in keyof Setting as `update${Capitalize<TKey>}`]: (
    body: Setting[TKey],
  ) => EnqueuedTaskPromise;
} & {
  [TKey in keyof Setting as `reset${Capitalize<TKey>}`]: () => EnqueuedTaskPromise;
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelToKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Returns an object containing all the setting functions.
 *
 * @remarks
 * This is similar to how it's done in the Meilisearch source code via
 * `meilisearch::routes::indexes::settings::make_setting_routes`.
 */
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
      Setting[keyof typeof opts]
    > {
      return await httpRequest.get({ path });
    };

    settingFns[`update${uppercaseName}`] = function (
      body: Setting[keyof typeof opts],
    ): EnqueuedTaskPromise {
      return httpRequestsWithTask[method]({ path, body });
    };

    settingFns[`reset${uppercaseName}`] = function (): EnqueuedTaskPromise {
      return httpRequestsWithTask.delete({ path });
    };
  }

  return settingFns as SettingFns;
}
