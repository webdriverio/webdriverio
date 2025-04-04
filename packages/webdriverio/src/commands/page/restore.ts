import type { SupportedScopes } from '../../types.js'
import { restoreFunctions } from '../../constants.js'

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

    it('should restore all emulated behavior', async () => {
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
 * @alias page.restore
 * @type utility
 *
 */
export async function restore (
    this: WebdriverIO.Page,
    scopes?: SupportedScopes | SupportedScopes[]
) {
    const scopeArray = !scopes || Array.isArray(scopes) ? scopes : [scopes]
    const instanceRestoreFunctions = restoreFunctions.get(this.contextId)
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
