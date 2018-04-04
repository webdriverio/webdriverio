
/**
 *
 * Open new window in browser. This command is the equivalent function to `window.open()`. This command does not
 * work in mobile environments.
 *
 * __Note:__ When calling this command you automatically switch to the new window.
 *
 * <example>
    :newWindowSync.js
    it('should open a new tab', function () {
        browser.url('http://google.com')
        console.log(browser.getTitle()); // outputs: "Google"
        browser.newWindow('http://webdriver.io', 'WebdriverIO window', 'width=420,height=230,resizable,scrollbars=yes,status=1')
        console.log(browser.getTitle()); // outputs: "WebdriverIO - WebDriver bindings for Node.js"
        browser.close()
        console.log(browser.getTitle()); // outputs: "Google"
    });
 * </example>
 *
 * @param {String} url            website URL to open
 * @param {String} windowName     name of the new window
 * @param {String} windowFeatures features of opened window (e.g. size, position, scrollbars, etc.)
 * @return {String}                id of window handle of new tab
 *
 * @uses browser/execute, protocol/getWindowHandles, protocol/switchToWindow
 * @alias browser.newWindow
 * @type window
 */

import newWindowHelper from '../../scripts/newWindow'
import { mobileDetector } from '../../utils'

export default async function newWindow (url, windowName = 'New Window', windowFeatures = '') {
    /*!
     * parameter check
     */
    if (typeof url !== 'string') {
        throw new Error('number or type of arguments don\'t agree with newWindow command')
    }

    /*!
     * mobile check
     */
    const { isMobile } = mobileDetector(this.capabilities)
    if (isMobile) {
        throw new Error('newWindow command is not supported on mobile platforms')
    }

    await this.execute(newWindowHelper, url, windowName, windowFeatures)

    const tabs = await this.getWindowHandles()
    const newTab = tabs.pop()

    await this.switchToWindow(newTab)
    return newTab
}
