const { execSync, spawn } = require('child_process')

let server

beforeAll(() => {
  execSync('yarn', ['build'], { env: process.env })

  server = spawn('node', ['.output/server/index.mjs'])
})

describe('Meilisearch JS w/ Nitro App Server Browser test', () => {
  it('Should have created an index and displayed it', async () => {
    await new Promise((next) => {
      server.stdout.on('data', () => {
        next()
        server.stdout.removeAllListeners('data')
      })
    })
    const response = await fetch('http://[::]:3000')
    const data = await response.json()

    expect(data.health).toBe(true)
  })

  afterAll(() => {
    server.kill()
  })
})
