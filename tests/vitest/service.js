describe('my feature', () => {
    it('should do stuff', async () => {
        expect(await browser.getTitle()).toBe('Mock Page Title')
        await expect(browser).toHaveTitle('Mock Page Title')
    })
})
