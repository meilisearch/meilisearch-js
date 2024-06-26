import { MeiliSearch } from './utils/meilisearch-test-utils';
import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchRequestError,
  MeiliSearchTimeOutError,
} from '../src/errors';
import 'jest-fetch-mock';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.setTimeout(100 * 1000);

// @TODO: Have to review this in more detail
describe('Test on updates', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  test(`Throw MeilisearchRequestError when throwned error is not MeiliSearchApiError`, async () => {
    fetchMock.mockReject(new Error('fake error message'));
    const client = new MeiliSearch({ host: 'http://localhost:9345' });
    try {
      await client.health();
    } catch (e: any) {
      expect(e.name).toEqual('MeiliSearchRequestError');
    }
  });

  test('MeiliSearchApiError can be compared with the instanceof operator', () => {
    expect(
      new MeiliSearchApiError(new Response(), {
        message: 'Some error',
        code: 'some_error',
        type: 'random_error',
        link: 'a link',
      }) instanceof MeiliSearchApiError,
    ).toEqual(true);
  });

  test('MeilisearchRequestError can be compared with the instanceof operator', async () => {
    fetchMock.mockReject(new Error('fake error message'));
    const client = new MeiliSearch({ host: 'http://localhost:9345' });
    try {
      await client.health();
    } catch (e: any) {
      expect(e instanceof MeiliSearchRequestError).toEqual(true);
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
