import { isUnknownMethodError, logAppiumDeprecationWarning } from '../../utils/mobile.js'

/**
 *
 * Get app strings for a specific language. Returns a key-value object of all string resources
 * defined in the application for the given language.
 *
 * > **Note:** Falls back to the deprecated Appium 2 protocol endpoint if the driver does not support the `mobile:` execute method.
 *
 * <example>
    :getStrings.js
    it('should get app strings', async () => {
        // Get strings for default language
        const strings = await browser.getStrings()
        // Get strings for a specific language
        const frStrings = await browser.getStrings('fr')
    })
 * </example>
 *
 * @param {string} [language]    Language code (e.g. `'fr'`, `'de'`). Defaults to the device language.
 * @param {string} [stringFile]  Path to the strings file (Android only).
 *
 * @returns {`Promise<Record<string, string>>`} Key-value map of all string resources.
 *
 * @support ["ios","android"]
 */
export async function getStrings(
    this: WebdriverIO.Browser,
    language?: string,
    stringFile?: string
): Promise<Record<string, string>> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `getStrings` command is only available for mobile platforms.')
    }

    try {
        return await browser.execute('mobile: getAppStrings', { language, stringFile }) as Record<string, string>
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        logAppiumDeprecationWarning('mobile: getAppStrings', '/appium/app/strings')
        return browser.appiumGetStrings(language, stringFile) as Promise<Record<string, string>>
    }
}
