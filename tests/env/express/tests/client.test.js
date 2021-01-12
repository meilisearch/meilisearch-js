describe('MeiliSearch JS Browser test', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'})
  })

  it('Should have generated a meilisearch client and displayed', async () => {
    await page.waitForNavigation({waitUntil: "domcontentloaded"})
    await page.waitForSelector("#indexes")
    await expect(
      page.content()
      ).resolves.toMatch('createdIndexTest')
  })
})
