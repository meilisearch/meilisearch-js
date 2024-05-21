import { EnqueuedTask } from '../src/enqueued-task'
import { Embedders } from '../src/types'
import {
  clearAllIndexes,
  config,
  HOST,
  BAD_HOST,
  MeiliSearch,
  getClient,
  getKey,
} from './utils/meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Admin' }])(
  'Test on embedders',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient(permission)
      const key = await getKey(permission)

      await fetch(`${HOST}/experimental-features`, {
        body: JSON.stringify({ vectorStore: true }),
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      const task = await client.createIndex(index.uid)
      await client.waitForTask(task.taskUid)
    })

    test(`${permission} key: Get default embedders`, async () => {
      const client = await getClient(permission)
      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual(null)
    })

    test(`${permission} key: Update embedders with 'userProvided' source`, async () => {
      const client = await getClient(permission)
      const newEmbedder: Embedders = {
        default: {
          source: 'userProvided',
          dimensions: 1,
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
        },
      }
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder)

      await client.waitForTask(task.taskUid)

      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual(newEmbedder)
    })

    test(`${permission} key: Update embedders with 'openAi' source`, async () => {
      const client = await getClient(permission)
      const newEmbedder: Embedders = {
        default: {
          source: 'openAi',
          apiKey: '<your-OpenAI-API-key>',
          model: 'text-embedding-3-small',
          documentTemplate:
            "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
          dimensions: 1536,
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
        },
      }
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder)
      await client.waitForTask(task.taskUid)

      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: '<yoXXXXX...',
        },
      })
    })

    test(`${permission} key: Update embedders with 'huggingFace' source`, async () => {
      const client = await getClient(permission)
      const newEmbedder: Embedders = {
        default: {
          source: 'huggingFace',
          model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
          documentTemplate:
            "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
        },
      }
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder)
      await client.waitForTask(task.taskUid, {timeOutMs: 60_000})

      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual(newEmbedder)
    })

    test(`${permission} key: Update embedders with 'rest' source`, async () => {
      const client = await getClient(permission)
      const newEmbedder: Embedders = {
        default: {
          source: 'rest',
          url: 'https://api.openai.com/v1/embeddings',
          apiKey: '<your-openai-api-key>',
          dimensions: 1536,
          documentTemplate:
            "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
          inputField: ['input'],
          inputType: 'textArray',
          query: {
            model: 'text-embedding-ada-002',
          },
          pathToEmbeddings: ['data'],
          embeddingObject: ['embedding'],
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
        },
      }
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder)
      await client.waitForTask(task.taskUid)

      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: '<yoXXXXX...',
        },
      })
    })

    test.skip(`${permission} key: Update embedders with 'ollama' source`, async () => {
      const client = await getClient(permission)
      const newEmbedder: Embedders = {
        default: {
          source: 'ollama',
          url: 'http://localhost:11434/api/embeddings',
          apiKey: '<your-ollama-api-key>',
          model: 'nomic-embed-text',
          documentTemplate: 'blabla',
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
        },
      }
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder)
      await client.waitForTask(task.taskUid)

      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: '<yoXXXXX...',
        },
      })
    })

    test(`${permission} key: Update embedders with a specific name`, async () => {
      const client = await getClient(permission)

      const newEmbedder: Embedders = {
        image: {
          source: 'userProvided',
          dimensions: 512,
        },
      }
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder)

      await client.waitForTask(task.taskUid)

      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual(newEmbedder)
    })

    test(`${permission} key: Reset embedders`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client.index(index.uid).resetEmbedders()
      await client.waitForTask(task.taskUid)

      const response: Embedders = await client.index(index.uid).getEmbedders()

      expect(response).toEqual(null)
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getEmbedders()).rejects.toHaveProperty(
      'message',
      `Request to ${strippedHost}/${route} has failed`
    )
  })

  test(`Test updateEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateEmbedders({})
    ).rejects.toHaveProperty(
      'message',
      `Request to ${strippedHost}/${route} has failed`
    )
  })

  test(`Test resetEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetEmbedders()
    ).rejects.toHaveProperty(
      'message',
      `Request to ${strippedHost}/${route} has failed`
    )
  })
})
