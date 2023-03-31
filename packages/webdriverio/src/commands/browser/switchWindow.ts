/**
 *
 * Switch focus to a particular tab / window.
 *
 * <example>
    :switchWindow.js
    it('should switch to another window', async () => {
        // open url
        await browser.url('https://google.com')

        // create new window
        await browser.newWindow('https://webdriver.io')

        // switch back via url match
        await browser.switchWindow('google.com')

        // switch back via title match
        await browser.switchWindow('Next-gen browser and mobile automation test framework for Node.js')
    });
 * </example>
 *
 * @param {String|RegExp}  matcher  String or regular expression that matches the title and url of the page or window name
 *
 * @uses protocol/getWindowHandles, protocol/switchToWindow, protocol/getUrl, protocol/getTitle
 * @alias browser.switchTab
 * @type window
 *
 */
export async function switchWindow (
    this: WebdriverIO.Browser,
    matcher: string | RegExp
) {
    /**
     * parameter check
     */
    if (typeof matcher !== 'string' && !(matcher instanceof RegExp)) {
        throw new Error('Unsupported parameter for switchWindow, required is "string" or an RegExp')
    }

    const tabs = await this.getWindowHandles()

    const matchesTarget = (target: string): boolean => {
        if (typeof matcher ==='string') {
            return target.includes(matcher)
        }
        return !!target.match(matcher)
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

        /**
         * check window name
         */
        const windowName = await this.execute(
            /* istanbul ignore next */
            () => window.name)
        if (windowName && matchesTarget(windowName)) {
            return tab
        }
    }

    throw new Error(`No window found with title, url or name matching "${matcher}"`)
}
