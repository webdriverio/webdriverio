
/**
 *
 * Switch focus to a particular tab / window.
 *
 * <example>
    :switchWindow.js
    it('should switch to another window', () => {
        // open url
        browser.url('https://google.com')
        // create new window
        browser.newWindow('https://webdriver.io')

        // switch back via url match
        browser.switchWindow('google.com')

        // switch back via title match
        browser.switchWindow('Next-gen browser and mobile automation test framework for Node.js')
    });
 * </example>
 *
 * @param {String|RegExp}  urlOrTitleToMatch  String or regular expression that matches the title or url of the page
 *
 * @uses protocol/getWindowHandles, protocol/switchToWindow, protocol/getUrl, protocol/getTitle
 * @alias browser.switchTab
 * @type window
 *
 */

export default async function switchWindow (this: WebdriverIO.BrowserObject, urlOrTitleToMatch: string | RegExp) {
    /*!
     * parameter check
     */
    if (typeof urlOrTitleToMatch !== 'string' && !(urlOrTitleToMatch instanceof RegExp)) {
        throw new Error('Unsupported parameter for switchWindow, required is "string" or an RegExp')
    }

    const tabs = await this.getWindowHandles()

    const matchesTarget = (target: string): boolean => {
        if (typeof urlOrTitleToMatch ==='string') {
            return target.includes(urlOrTitleToMatch)
        }
        return !!target.match(urlOrTitleToMatch)
    }

    for (const tab of tabs) {
        await this.switchToWindow(tab)

        /**
         * check if url matches
         */
        const url = await this.getUrl()
        if (matchesTarget(url)) {
            return tab
        }

        /**
         * check title
         */
        const title = await this.getTitle()
        if (matchesTarget(title)) {
            return tab
        }
    }

    throw new Error(`No window found with title or url matching "${urlOrTitleToMatch}"`)
}
