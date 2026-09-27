import { executeMobile } from '../../utils/mobile.js'

/**
 *
 * Get app strings for a specific language. Returns a key-value object of all string resources
 * defined in the application for the given language.
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

    return executeMobile<Record<string, string>>(browser, 'mobile: getAppStrings', { language, stringFile })
}
