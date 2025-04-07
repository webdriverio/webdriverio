import { sleep } from '@wdio/utils'

import newWindowHelper from '../../scripts/newWindow.js'
import { getContextManager } from '../../session/context.js'
import { getBasePage } from '../../browsingContext/index.js'
import type { NewWindowOptions } from '../../types.js'
import logger from '@wdio/logger'
const log = logger('webdriverio:newWindow')

const WAIT_FOR_NEW_HANDLE_TIMEOUT = 3000

/**
 *
 * Open new window or tab in browser (defaults to a new window if not specified).
 * This command is the equivalent function to `window.open()`. This command does not work in mobile environments.
 *
 * __Note:__ When calling this command you automatically switch to the new window or tab.
 *
 * <example>
    :newWindowSync.js
    it('should open a new window', async () => {
        await browser.url('https://google.com')
        console.log(await browser.getTitle()) // outputs: "Google"

        const result = await browser.newWindow('https://webdriver.io', {
            windowName: 'WebdriverIO window',
            windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1',
        })
        console.log(await browser.getTitle()) // outputs: "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
        console.log(result.type) // outputs: "window"
        const handles = await browser.getWindowHandles()
        await browser.switchToWindow(handles[1])
        await browser.closeWindow()
        await browser.switchToWindow(handles[0])
        console.log(await browser.getTitle()) // outputs: "Google"
    });
 * </example>
 * <example>
      :newTabSync.js
      it('should open a new tab', async () => {
          await browser.url('https://google.com')
          console.log(await browser.getTitle()) // outputs: "Google"

          await browser.newWindow('https://webdriver.io', {
              type:'tab',
              windowName: 'WebdriverIO window',
              windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1',
          })
          console.log(await browser.getTitle()) // outputs: "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
          console.log(result.type) // outputs: "tab"
          const handles = await browser.getWindowHandles()
          await browser.switchToWindow(handles[1])
          await browser.closeWindow()
          await browser.switchToWindow(handles[0])
          console.log(await browser.getTitle()) // outputs: "Google"
     });
 * </example>
 *
 * @param {string}  url      website URL to open
 * @param {NewWindowOptions=} options                newWindow command options
 * @param {string=}           options.type           type of new window: 'tab' or 'window'
 * @param {String=}           options.windowName     name of the new window
 * @param {String=}           options.windowFeatures features of opened window (e.g. size, position, scrollbars, etc.)
 *
 * @return {Object}          An object containing the window handle and the type of new window `{handle: string, type: string}` handle - The ID of the window handle of the new tab or window, type - The type of the new window, either 'tab' or 'window'
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
    { type = 'window', windowName = '', windowFeatures = '' }: NewWindowOptions = {}
): Promise<{ handle: string, type: 'tab' | 'window' } | WebdriverIO.BrowsingContext> {
    if (globalThis.wdio) {
        throw new Error('"newWindow" command is not supported when using browser runner')
    }

    /**
     * parameter check
     */
    if (typeof url !== 'string') {
        throw new Error('number or type of arguments don\'t agree with newWindow command')
    }

    /**
    * Validate the 'type' parameter to ensure it is either 'tab' or 'window'
    */
    if (!['tab', 'window'].includes(type)) {
        throw new Error(`Invalid type '${type}' provided to newWindow command. Use either 'tab' or 'window'`)
    }

    if (windowName || windowFeatures) {
        log.warn('The "windowName" and "windowFeatures" options are deprecated and only supported in WebDriver Classic sessions.')
    }

    /**
     * mobile check
     */
    if (this.isMobile) {
        throw new Error('newWindow command is not supported on mobile platforms')
    }

    const tabsBefore = await this.getWindowHandles()

    if (this.isBidi) {
        const page = await getBasePage.call(this)
        const contextManager = getContextManager(this)
        const newPage = await page.newWindow(url, { type })
        contextManager.setCurrentContext(newPage.contextId)
        return newPage
    }
    await this.execute(newWindowHelper, url, windowName, windowFeatures)

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
