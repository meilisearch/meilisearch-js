describe('MeiliSearch JS Browser test', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000')
  })

  it('Should have generated a meilisearch client and displayed', async () => {
    jest.setTimeout(100 * 1000)
    await page.waitForSelector("#indexes")
    await expect(
      page.content()
      ).resolves.toMatch('createdIndexTest')
  }, 10000)
})
