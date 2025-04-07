import { getPage } from '../../browsingContext/index.js'
import { navigateContext } from '../browser/url.js'

/**
 *
 * Open new window or tab in browser (defaults to a new window if not specified).
 * This command is the equivalent function to `window.open()`. This command does not work in mobile environments.
 *
 * __Note:__ When calling this command you automatically switch to the new window or tab.
 *
 * <example>
    :newWindow.js
    it('should open a new window', async () => {
        const page = await browser.url('https://google.com')
        console.log(await page.getTitle()) // outputs: "Google"

        const newWindow = await page.newWindow('https://webdriver.io', {
            type: 'window'
        })

        const newTab = await page.newWindow('https://bing.com', {
            type: 'tab'
        })

        console.log(await page.getTitle()) // outputs: "Google"
        console.log(page.type) // outputs: "tab"
        console.log(await newWindow.getTitle()) // outputs: "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
        console.log(newWindow.type) // outputs: "window"
        console.log(await newTab.getTitle()) // outputs: "Bing"
        console.log(newTab.type) // outputs: "tab"
    });
 * </example>
 *
 * @param {string}  url      website URL to open
 * @param {NewWindowOptions=} options                newWindow command options
 * @param {string=}           options.type           type of new window: 'tab' or 'window'
 *
 * @return {WebdriverIO.BrowsingContext} a `WebdriverIO.BrowsingContext` object
 * @throws {Error} If `url` is invalid, if the command is used on mobile, or `type` is not 'tab' or 'window'.
 *
 * @alias page.newWindow
 */
export async function newWindow (
    this: WebdriverIO.BrowsingContext,
    url: string,
    props: { type: 'tab' | 'window' }
): Promise<WebdriverIO.BrowsingContext> {
    const { context } = await this.browser.browsingContextCreate({
        type: props.type,
        referenceContext: this.contextId
    })
    const request = await navigateContext.call(this.browser, url, context)
    const isTab = props.type === 'tab'
    const isWindow = props.type === 'window'
    return getPage.call(this.browser, context, { isIframe: false, isTab, isWindow, request, parent: this })
}
