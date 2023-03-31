describe('Jasmine timeout test', () => {
    it('should fail due to custom timeout', () => {
        return new Promise((resolve) => setTimeout(resolve, 2000))
    }, 1000)

    // https://github.com/webdriverio/webdriverio/issues/8126
    it('do not run into max callstack errors', () => {
        expect(true).toBe(false)
    })

    it('should allow also async assertions afterwards', async () => {
        await expect(browser).toHaveTitle('Mock Page Title')
    })
})
