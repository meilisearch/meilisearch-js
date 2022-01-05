describe('MeiliSearch JS Browser test', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000')
  })

  it('Should have created an index and displayed it', async () => {
    await page.waitForSelector("#indexes")
    await expect(
      page.content()
      ).resolves.toMatch('testIndex')
  })

  it('Should have successfully searched on the index', async () => {
    await page.waitForSelector("#indexes")
    await expect(
      page.content()
      ).resolves.toMatch('wonder woman')
  })
})
