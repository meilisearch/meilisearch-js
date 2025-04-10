import type { HttpRequests } from "./http-requests.js";
import type { HttpRequestsWithEnqueuedTaskPromise } from "./task.js";
import type {
  EnqueuedTaskPromise,
  IndividualUpdatableSettings,
  RecordAny,
} from "./types/index.js";

/** Each setting mapped to their REST method required for updates. */
type MakeSettingsRecord = {
  [TKey in keyof IndividualUpdatableSettings]: "put" | "patch";
};

export type SettingFns = {
  [TKey in keyof IndividualUpdatableSettings as `get${Capitalize<TKey>}`]: () => Promise<
    IndividualUpdatableSettings[TKey]
  >;
} & {
  [TKey in keyof IndividualUpdatableSettings as `update${Capitalize<TKey>}`]: (
    body: IndividualUpdatableSettings[TKey],
  ) => EnqueuedTaskPromise;
} & {
  [TKey in keyof IndividualUpdatableSettings as `reset${Capitalize<TKey>}`]: () => EnqueuedTaskPromise;
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelToKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// TODO: Doc
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
      IndividualUpdatableSettings[keyof typeof opts]
    > {
      return await httpRequest.get({ path });
    };

    settingFns[`update${uppercaseName}`] = function (
      body: IndividualUpdatableSettings[keyof typeof opts],
    ): EnqueuedTaskPromise {
      return httpRequestsWithTask[method]({ path, body });
    };

    settingFns[`reset${uppercaseName}`] = function (): EnqueuedTaskPromise {
      return httpRequestsWithTask.delete({ path });
    };
  }

  return settingFns as SettingFns;
}
