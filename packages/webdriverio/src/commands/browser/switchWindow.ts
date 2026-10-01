import { getContextManager } from '../../session/context.js'

/**
 * Switch focus to a particular tab / window (Classic sessions).
 *
 * In a WebDriver BiDi session this command throws. `browser.url()` and
 * `browser.newWindow()` return the browsing context, and `browser.browsingContexts()`
 * lists the open top-level contexts. Commands run on the context you hold.
 *
 * <example>
    :switchWindow.js
    it('should switch to another window', async () => {
        // Classic
        await browser.url('https://google.com')
        const handle = await browser.getWindowHandle()
        await browser.newWindow('https://webdriver.io')
        await browser.switchWindow('google.com')
        await browser.switchWindow(handle)

        // BiDi
        const google = await browser.url('https://google.com')
        const docs = await browser.newWindow('https://webdriver.io')
        console.log(await docs.getTitle())
        console.log(await google.getTitle())
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
): Promise<string> {
    if (this.isBidi) {
        throw new Error(
            '`switchWindow` was removed for WebDriver BiDi sessions in WebdriverIO v10. ' +
            'Hold the browsing context returned by `browser.url()` or `browser.newWindow()`, ' +
            'or find one with `browser.browsingContexts()`.'
        )
    }

    /**
     * parameter check
     */
    if (typeof matcher !== 'string' && !(matcher instanceof RegExp)) {
        throw new Error('Unsupported parameter for switchWindow, required is "string" or a RegExp')
    }

    const contextManager = getContextManager(this)
    const tabs = await this.getWindowHandles()

    // is the matcher a window handle and is it in the list of tabs?
    if (typeof matcher === 'string' && tabs.includes(matcher)) {
        // are we in the right window already?
        if (matcher ===  contextManager.getCurrentWindowHandle()) {
            return matcher
        }
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
