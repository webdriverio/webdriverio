import os from 'node:os'
import assert from 'node:assert'

describe('Mocha smoke test', () => {
    it('should be able to wait for an element', async () => {
        /**
         * this fails in Windows CI even though passes locally
         * [firefox 64 mac #0-1] Error: element ("elem") still not displayed after 5000ms
         * [firefox 64 mac #0-1]     at file:///D:/a/webdriverio/webdriverio/packages/webdriverio/build/commands/browser/waitUntil.js:61:23
         * [firefox 64 mac #0-1]     at async Element.wrapCommandFn (file:///D:/a/webdriverio/webdriverio/packages/wdio-utils/build/shim.js:72:29)
         */
        if (os.platform() === 'win32') {
            return
        }

        // @ts-expect-error custom command
        await browser.waitForDisplayedScenario()
        assert(await $('elem').waitForDisplayed())
    })
})
