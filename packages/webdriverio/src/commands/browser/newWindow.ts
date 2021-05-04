import newWindowHelper from '../../scripts/newWindow'
import type { NewWindowOptions } from '../../types'

/**
 *
 * Open new window in browser. This command is the equivalent function to `window.open()`. This command does not
 * work in mobile environments.
 *
 * __Note:__ When calling this command you automatically switch to the new window.
 *
 * <example>
    :newWindowSync.js
    it('should open a new tab', () => {
          browser.url('https://google.com')
          console.log(browser.getTitle()) // outputs: "Google"

        browser.newWindow('https://webdriver.io', {
            windowName: 'WebdriverIO window',
            windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1',
        })
        console.log(browser.getTitle()) // outputs: "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"

        const handles = browser.getWindowHandles()
        browser.switchToWindow(handles[1])
        browser.closeWindow()
        browser.switchToWindow(handles[0])
        console.log(browser.getTitle()) // outputs: "Google"
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
    { windowName = 'New Window', windowFeatures = '' }: NewWindowOptions = {}
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

    await this.execute(newWindowHelper, url, windowName, windowFeatures)

    const tabs = await this.getWindowHandles()
    const newTab = tabs.pop()

    if (!newTab) {
        throw new Error('No window handle was found to switch to')
    }

    await this.switchToWindow(newTab)
    return newTab
}
