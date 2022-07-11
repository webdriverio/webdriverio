describe('Mocha smoke test', () => {
    describe('middleware', () => {
        it('should wait for elements if not found immediately', async () => {
            // @ts-expect-error custom command
            await browser.waitForElementScenario()
            const elem = await $('elem')
            //Element will be found
            await elem.click()
        })

        it('should refetch stale elements', async () => {
            // @ts-expect-error custom command
            await browser.staleElementRefetchScenario()

            const elem = await $('elem')
            await elem.click()
            // element becomes stale
            await elem.click()
        })
    })
})
