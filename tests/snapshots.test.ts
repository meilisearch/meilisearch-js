import { ErrorStatusCode } from '../src/types';
import {
  clearAllIndexes,
  config,
  MeiliSearch,
  BAD_HOST,
  getClient,
} from './utils/meilisearch-test-utils';

beforeEach(async () => {
  await clearAllIndexes(config);
});

describe.each([{ permission: 'Master' }, { permission: 'Admin' }])(
  'Test on snapshot',
  ({ permission }) => {
    test(`${permission} key: create a new snapshot`, async () => {
      const client = await getClient(permission);
      const { taskUid } = await client.createSnapshot();

      await client.waitForTask(taskUid);
    });
  },
);

describe.each([{ permission: 'Search' }])(
  'Test on snapshot with search api key should not have access',
  ({ permission }) => {
    test(`${permission} key: try to create snapshot with search key and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.createSnapshot()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY,
      );
    });
  },
);

describe.each([{ permission: 'No' }])(
  'Test on snapshot without api key should not have access',
  ({ permission }) => {
    test(`${permission} key: try to create snapshot with no key and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.createSnapshot()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test createSnapshot route`, async () => {
    const route = `snapshots`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;

    await expect(client.createSnapshot()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        '',
      )}`,
    );
  });
});
