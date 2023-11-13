import { browser } from '@wdio/globals'
import type { local } from 'webdriver'

describe('bidi e2e test', () => {
    it('can send bidi commands', async function () {
        /**
         * skip in case of Safari
         */
        if (!browser.isBidi) {
            return this.skip()
        }

        const result = await browser.browsingContextGetTree({})
        const context = await browser.getWindowHandle()
        expect(result.contexts).toHaveLength(1)
        expect(result.contexts[0].context).toBe(context)
    })

    it('can listen to events', async function () {
        /**
         * skip in case of Safari
         */
        if (!browser.isBidi) {
            return this.skip()
        }

        const logEvents: local.LogEntry[] = []
        await browser.sessionSubscribe({ events: ['log.entryAdded'] })
        browser.on('log.entryAdded', (logEntry) => logEvents.push(logEntry))
        await browser.execute(() => console.log('Hello Bidi'))
        // eslint-disable-next-line wdio/no-pause
        await browser.pause(100)
        expect(logEvents).toHaveLength(1)
        expect(logEvents[0].text).toBe('Hello Bidi')
    })
})
