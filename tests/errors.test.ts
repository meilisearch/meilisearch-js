import { MeiliSearch } from './utils/meilisearch-test-utils';
import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchCommunicationError,
  MeiliSearchTimeOutError,
} from '../src/errors';
import 'jest-fetch-mock';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.setTimeout(100 * 1000);

describe('Test on updates', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  test(`Throw MeiliSearchCommunicationError when throwned error is not MeiliSearchApiError`, async () => {
    fetchMock.mockReject(new Error('fake error message'));
    const client = new MeiliSearch({ host: 'http://localhost:9345' });
    try {
      await client.health();
    } catch (e: any) {
      expect(e.name).toEqual('MeiliSearchCommunicationError');
    }
  });

  test(`Not throw MeiliSearchCommunicationError when throwned error is MeiliSearchApiError`, async () => {
    fetchMock.mockReject(
      new MeiliSearchApiError(
        {
          message: 'Some error',
          code: 'some_error',
          type: 'random_error',
          link: 'a link',
        },
        404,
      ),
    );

    const client = new MeiliSearch({ host: 'http://localhost:9345' });
    try {
      await client.health();
    } catch (e: any) {
      expect(e.name).toEqual('MeiliSearchApiError');
    }
  });

  test('MeiliSearchApiError can be compared with the instanceof operator', async () => {
    fetchMock.mockReject(
      new MeiliSearchApiError(
        {
          message: 'Some error',
          code: 'some_error',
          type: 'random_error',
          link: 'a link',
        },
        404,
      ),
    );

    const client = new MeiliSearch({ host: 'http://localhost:9345' });
    try {
      await client.health();
    } catch (e: any) {
      expect(e instanceof MeiliSearchApiError).toEqual(true);
    }
  });

  test('MeiliSearchCommunicationError can be compared with the instanceof operator', async () => {
    fetchMock.mockReject(new Error('fake error message'));
    const client = new MeiliSearch({ host: 'http://localhost:9345' });
    try {
      await client.health();
    } catch (e: any) {
      expect(e instanceof MeiliSearchCommunicationError).toEqual(true);
    }
  });

  test('MeiliSearchError can be compared with the instanceof operator', () => {
    try {
      throw new MeiliSearchError('message');
    } catch (e: any) {
      expect(e instanceof MeiliSearchError).toEqual(true);
    }
  });

  test('MeiliSearchTimeOutError can be compared with the instanceof operator', () => {
    try {
      throw new MeiliSearchTimeOutError('message');
    } catch (e: any) {
      expect(e instanceof MeiliSearchTimeOutError).toEqual(true);
    }
  });
});
