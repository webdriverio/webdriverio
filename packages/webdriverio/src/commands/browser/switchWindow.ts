import { getContextManager } from '../../session/context.js'

/**
 *
 * Switch focus to a particular tab / window.
 *
 * <example>
    :switchWindow.js
    it('should switch to another window', async () => {
        // open url
        await browser.url('https://google.com')

        // get window handle
        const handle = await browser.getWindowHandle()

        // create new window
        await browser.newWindow('https://webdriver.io')

        // switch back via url match
        await browser.switchWindow('google.com')

        // switch back via title match
        await browser.switchWindow('Next-gen browser and mobile automation test framework for Node.js')

        // switch back via window handle
        await browser.switchWindow(handle)
    });
 * </example>
 *
 * @param {String|RegExp}  matcher  String or regular expression that matches either the page title or URL, the window name, or the window handle
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
        throw new Error('Unsupported parameter for switchWindow, required is "string" or a RegExp')
    }

    const currentWindow = await this.getWindowHandle()
        /**
         * in cases where a browser window was closed by e.g. clicking on a button
         * this command may throws an "no such window: target window already closed"
         * error. In this case we return `undefined` and determine the new window
         * based on the command parameter.
         */
        .catch(() => undefined)

    // is the matcher a window handle, and are we in the right window already?
    if (typeof matcher === 'string' && currentWindow === matcher) {
        return currentWindow
    }

    const contextManager = getContextManager(this)
    const tabs = await this.getWindowHandles()

    // is the matcher a window handle and is it in the list of tabs?
    if (typeof matcher === 'string' && tabs.includes(matcher)) {
        await this.switchToWindow(matcher)
        contextManager.setCurrentContext(matcher)
        return matcher
    }

    const matchesTarget = (target: string): boolean => {
        if (typeof matcher === 'string') {
            return target.includes(matcher)
        }
        return matcher.test(target)
    }

    for (const tab of tabs) {
        await this.switchToWindow(tab)
        contextManager.setCurrentContext(tab)

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

    throw new Error(`No window found with title, url, name or window handle matching "${matcher}"`)
}
