import { getBrowserObject } from '@wdio/utils'

import { restoreFunctions } from '../../constants.js'
import type { SupportedScopes } from '../../types.js'

/**
 *
 * This command restores specific or all emulated behaviors that were set using the `emulate` command.
 *
 * <example>
    :restore.js
    before(async () => {
        await browser.emulate('geolocation', { latitude: 52.52, longitude: 13.405 })
        await browser.emulate('userAgent', 'foobar')
        await browser.emulate('colorScheme', 'dark')
        await browser.emulate('onLine', false)
    })

    it('should run in an emulated environment', async () => {
        await browser.url('https://webdriver.io')
        // test within an emulated environment...
    })

    after(async () => {
        // restore all emulated behavior
        await browser.restore()
        // or only restore specific emulated behavior
        // await browser.restore(['geolocation', 'userAgent'])
    })
 * </example>
 *
 * @alias browser.restore
 * @type utility
 *
 */
export async function restore (
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    scopes?: SupportedScopes | SupportedScopes[]
) {
    const browser = getBrowserObject(this)
    const scopeArray = !scopes || Array.isArray(scopes) ? scopes : [scopes]
    const instanceRestoreFunctions = restoreFunctions.get(browser.sessionId)
    if (!instanceRestoreFunctions) {
        return
    }

    await Promise.all(Array.from(instanceRestoreFunctions.entries()).map(async ([scope, restoreFunctionsList]) => {
        if (!scopeArray || scopeArray.includes(scope)) {
            await Promise.all(restoreFunctionsList.map((fn) => fn()))
            instanceRestoreFunctions.set(scope, [])
        }
    }))
}
