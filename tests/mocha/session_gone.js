describe('session gone', () => {
    it('ends with a report when the session cannot be deleted', async () => {
        await browser.sessionGoneScenario()
        await expect(browser).toHaveTitle('Mock Page Title')
    })
})
