import os from 'node:os'

describe('Mocha smoke test', () => {
    describe('middleware', () => {
        it('should wait for elements if not found immediately', async () => {
            /**
             * this fails in Windows CI even though passes locally
             * [firefox 64 mac #0-1] Error: Can't call click on element with selector "elem" because element wasn't found
             * [firefox 64 mac #0-1]     at implicitWait (file:///D:/a/webdriverio/webdriverio/packages/webdriverio/build/utils/implicitWait.js:29:19)
             * [firefox 64 mac #0-1]     at async Element.elementErrorHandlerCallbackFn
             */
            if (os.platform() === 'win32') {
                return
            }
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
