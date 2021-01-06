import {
  clearAllIndexes,
  config,
  MeiliSearch,
  Index,
} from './meilisearch-test-utils'

afterAll(() => {
  return clearAllIndexes(config)
})

test(`Client handles host URL with domain and path`, () => {
  const customHost = `${config.host}/api/`
  const client = new MeiliSearch({
    host: customHost,
  })
  expect(client.config.host).toBe(customHost)
  expect(client.httpRequest.url.href).toBe(customHost)
})

test(`Client handles host URL with domain and path and no trailing slash`, () => {
  const customHost = `${config.host}/api`
  const client = new MeiliSearch({
    host: customHost,
  })
  expect(client.config.host).toBe(customHost + '/')
  expect(client.httpRequest.url.href).toBe(customHost + '/')
})

test(`Test for trailing and starting slashes in every MeiliSearch subroute`, () => {
  const subroutes = MeiliSearch.getApiRoutes()
  const subRoutesMethods = MeiliSearch.getRouteConstructors()

  const meiliSearchSubRoutesCheck = Object.values(subroutes).filter(
    (path) => path.endsWith('/') || path.startsWith('/')
  )
  const MeiliSearchSubRoutesConstructorsCheck = Object.values(
    subRoutesMethods
  ).filter((method) => {
    const res = method(1)
    return res.endsWith('/') || res.startsWith('/')
  })
  expect(meiliSearchSubRoutesCheck).toEqual([])
  expect(MeiliSearchSubRoutesConstructorsCheck).toEqual([])

  const health = true
  expect(health).toBe(true) // Left here to trigger failed test if error is not thrown
})

test(`Test for trailing and starting slashes in every Index subroute`, () => {
  const subroutes = Index.getApiRoutes()
  const subRoutesMethods = Index.getRouteConstructors()

  const IndexSubRoutesCheck = Object.values(subroutes).filter(
    (path) => path.endsWith('/') || path.startsWith('/')
  )
  const IndexSubRoutesConstructorsCheck = Object.values(
    subRoutesMethods
  ).filter((method) => {
    const res = method('1', '1')
    return res.endsWith('/') || res.startsWith('/')
  })
  expect(IndexSubRoutesCheck).toEqual([])
  expect(IndexSubRoutesConstructorsCheck).toEqual([])

  const health = true
  expect(health).toBe(true) // Left here to trigger failed test if error is not thrown
})
