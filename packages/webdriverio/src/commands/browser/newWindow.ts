import { sleep } from '@wdio/utils'

import newWindowHelper from '../../scripts/newWindow.js'
import { getBrowsingContext } from '../../browsingContext.js'
import { historyReadiness } from '../../utils/traverseHistory.js'
import type { NewWindowOptions } from '../../types.js'

const WAIT_FOR_NEW_HANDLE_TIMEOUT = 3000

/**
 *
 * Open a new window or tab and wait until its page has loaded, the equivalent of `window.open()`.
 * This command does not work in mobile environments.
 *
 * In a WebDriver BiDi session (the default since v10) it returns the new
 * [browsing context](/docs/api/browsingContext) and does not switch to it: run
 * commands on the returned context, while `browser.url()` keeps navigating the
 * first one. In a WebDriver Classic session the command switches to the new window
 * and returns `{ handle, type }`.
 *
 * <example>
    :newWindow.js
    it('should open a new tab', async () => {
        const page = await browser.url('https://webdriver.io')
        const tab = await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        console.log(await tab.getTitle()) // the title of the API page
        console.log(await page.getTitle()) // the first tab still answers commands
        await tab.closeWindow()
    });
 * </example>
 *
 * @param {string}  url      website URL to open
 * @param {NewWindowOptions=} options                newWindow command options
 * @param {string=}           options.type           type of new window: 'tab' or 'window'
 *
 * @return {BrowsingContext|Object}  In a BiDi session, the new browsing context. In a Classic session, `{handle, type}`.
 *
 * @throws {Error} If `url` is invalid, if the command is used on mobile, or `type` is not 'tab' or 'window'.
 *
 * @uses browser/execute, protocol/getWindowHandles, protocol/switchToWindow
 * @alias browser.newWindow
 * @type window or tab
 */
export async function newWindow (
    this: WebdriverIO.Browser,
    url: string,
    options: NewWindowOptions = {}
): Promise<WebdriverIO.BrowsingContext | { handle: string, type: 'tab' | 'window' }> {
    /**
     * parameter check
     */
    if (typeof url !== 'string') {
        throw new Error('number or type of arguments don\'t agree with newWindow command')
    }

    const legacyOptions = options as NewWindowOptions & {
        windowName?: string
        windowFeatures?: string
        windowFeature?: string
    }
    if (legacyOptions.windowName || legacyOptions.windowFeatures || legacyOptions.windowFeature) {
        throw new Error(
            'The `windowName` and `windowFeatures` options were removed from `newWindow` in WebdriverIO v10. ' +
            'Only `{ type: \'tab\' | \'window\' }` is supported.'
        )
    }

    const { type = 'window' } = options

    /**
    * Validate the 'type' parameter to ensure it is either 'tab' or 'window'
    */
    if (!['tab', 'window'].includes(type)) {
        throw new Error(`Invalid type '${type}' provided to newWindow command. Use either 'tab' or 'window'`)
    }

    /**
     * mobile check
     */
    if (this.isMobile) {
        throw new Error('newWindow command is not supported on mobile platforms')
    }

    const tabsBefore = await this.getWindowHandles()

    if (this.isBidi) {
        const reference = options.referenceContext
        if (reference && typeof reference !== 'string' && reference.isFrame) {
            throw new Error('`referenceContext` must be a top-level browsing context')
        }
        const referenceContext = typeof reference === 'string'
            ? reference
            : reference?.contextId
        const { context } = await this.browsingContextCreate({
            type,
            ...(referenceContext ? { referenceContext } : {})
        })
        /**
         * Hand back a loaded page, like `browser.url()`. A context returned
         * mid-load races the next navigation, which Firefox never completes.
         */
        await this.browsingContextNavigate({ context, url, wait: historyReadiness(this.capabilities.pageLoadStrategy) })
        return getBrowsingContext(this, context, { isFrame: false, url })
    }

    await this.execute(newWindowHelper, url)

    /**
     * if tests are run in DevTools there might be a delay until
     * a new window handle got registered, this little procedure
     * waits for it to exist and avoid race conditions
     */
    let tabsAfter = await this.getWindowHandles()
    const now = Date.now()
    while ((Date.now() - now) < WAIT_FOR_NEW_HANDLE_TIMEOUT) {
        tabsAfter = await this.getWindowHandles()
        if (tabsAfter.length > tabsBefore.length) {
            break
        }
        await sleep(100)
    }
    const newTab = tabsAfter.pop()

    if (!newTab) {
        throw new Error('No window handle was found to switch to')
    }

    await this.switchToWindow(newTab)
    return { handle: newTab, type }
}
