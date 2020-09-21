describe('Instant MeiliSearch Browser test', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000')
  })

  it('Should have generated a instant-meiisearch client and displayed', async () => {
    await expect(page).toMatch(
      '{"client":{"cancelTokenSource":{"token":{"promise":{}}},"config":{"host":"http://localhost:7700","apiKey":"masterKey"}},"attributesToHighlight":["*"],"paginationTotalHits":200,"placeholderSearch":true}'
    )
  })
})
