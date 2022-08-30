import { sleep } from '@wdio/utils'

import newWindowHelper from '../../scripts/newWindow.js'
import type { NewWindowOptions } from '../../types'

const WAIT_FOR_NEW_HANDLE_TIMEOUT = 3000

/**
 *
 * Open new window in browser. This command is the equivalent function to `window.open()`. This command does not
 * work in mobile environments.
 *
 * __Note:__ When calling this command you automatically switch to the new window.
 *
 * <example>
    :newWindowSync.js
    it('should open a new tab', async () => {
        await browser.url('https://google.com')
        console.log(await browser.getTitle()) // outputs: "Google"

        await browser.newWindow('https://webdriver.io', {
            windowName: 'WebdriverIO window',
            windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1',
        })
        console.log(await browser.getTitle()) // outputs: "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"

        const handles = await browser.getWindowHandles()
        await browser.switchToWindow(handles[1])
        await browser.closeWindow()
        await browser.switchToWindow(handles[0])
        console.log(await browser.getTitle()) // outputs: "Google"
    });
 * </example>
 *
 * @param {String}  url      website URL to open
 * @param {NewWindowOptions=} options                newWindow command options
 * @param {String=}           options.windowName     name of the new window
 * @param {String=}           options.windowFeatures features of opened window (e.g. size, position, scrollbars, etc.)
 *
 * @return {String}          id of window handle of new tab
 *
 * @uses browser/execute, protocol/getWindowHandles, protocol/switchToWindow
 * @alias browser.newWindow
 * @type window
 */
export default async function newWindow (
    this: WebdriverIO.Browser,
    url: string,
    { windowName = '', windowFeatures = '' }: NewWindowOptions = {}
) {
    /**
     * parameter check
     */
    if (typeof url !== 'string') {
        throw new Error('number or type of arguments don\'t agree with newWindow command')
    }

    /**
     * mobile check
     */
    if (this.isMobile) {
        throw new Error('newWindow command is not supported on mobile platforms')
    }

    const tabsBefore = await this.getWindowHandles()
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
    return newTab
}
