import { MeiliSearch } from './utils/meilisearch-test-utils'
import { MeiliSearchApiError } from '../src/errors'
import 'jest-fetch-mock'
import fetchMock from 'jest-fetch-mock'

fetchMock.enableMocks()

jest.setTimeout(100 * 1000)

describe('Test on updates', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  test(`Throw MeiliSearchCommunicationError when throwned error is not MeiliSearchApiError`, async () => {
    fetchMock.mockReject(new Error('fake error message'))
    const client = new MeiliSearch({ host: 'http://localhost:9345' })
    try {
      await client.health()
    } catch (e: any) {
      expect(e.name).toEqual('MeiliSearchCommunicationError')
    }
  })

  test(`Not throw MeiliSearchCommunicationError when throwned error is not MeiliSearchApiError`, async () => {
    fetchMock.mockReject(
      new MeiliSearchApiError(
        {
          message: 'Some error',
          code: 'some_error',
          type: 'random_error',
          link: 'a link',
        },
        404
      )
    )

    const client = new MeiliSearch({ host: 'http://localhost:9345' })
    try {
      await client.health()
    } catch (e: any) {
      expect(e.name).toEqual('MeiliSearchApiError')
    }
  })
})
