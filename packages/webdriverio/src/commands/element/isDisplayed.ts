import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject, hasElementId } from '../../utils/index.js'
import isElementDisplayedScript from '../../scripts/isElementDisplayed.js'

const noW3CEndpoint = ['microsoftedge', 'msedge', 'safari', 'chrome', 'safari technology preview']
const browserWithDriverIssues = ['firefox']

/**
 *
 * Return true if the selected DOM-element is displayed (even when the element is outside the viewport).
 * If you want to verify that the element is also not within the viewport, use the isDisplayedInViewport command.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the element
 * to exist to execute this command.
 *
 * :::
 *
 * <example>
    :index.html
    <div id="noSize"></div>
    <div id="noSizeWithContent">Hello World!</div>
    <div id="notDisplayed" style="width: 10px; height: 10px; display: none"></div>
    <div id="notVisible" style="width: 10px; height: 10px; visibility: hidden"></div>
    <div id="zeroOpacity" style="width: 10px; height: 10px; opacity: 0"></div>
    <div id="notInViewport" style="width: 10px; height: 10px; position:fixed; top: 999999; left: 999999"></div>
    :isDisplayed.js
    it('should detect if an element is displayed', async () => {
        elem = await $('#notExisting');
        isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        let elem = await $('#noSize');
        let isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        let elem = await $('#noSizeWithContent');
        let isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: true

        let elem = await $('#notDisplayed');
        let isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = await $('#notVisible');
        isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = await $('#zeroOpacity');
        isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = await $('#notInViewport');
        isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: true
    });
 * </example>
 *
 * @alias element.isDisplayed
 * @return {Boolean} true if element is displayed
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */
export async function isDisplayed (this: WebdriverIO.Element) {
    const browser = getBrowserObject(this)

    if (!await hasElementId(this)) {
        return false
    }

    const isListedBrowser = noW3CEndpoint.includes((browser.capabilities as WebdriverIO.Capabilities).browserName?.toLowerCase()!) ||
    browserWithDriverIssues.includes((browser.capabilities as WebdriverIO.Capabilities).browserName?.toLowerCase()!)
    /*
     * https://www.w3.org/TR/webdriver/#element-displayedness
     * Certain drivers have decided to remove the endpoint as the spec
     * no longer dictates it. In those instances, we pass the element through a script
     * that was provided by Brian Burg, maintainer of Safaridriver.
     *
     * 6th of May 2019 APPIUM response (mykola-mokhnach) :
     * - Appium didn't enable W3C mode for mobile drivers.
     * - Safari and Chrome work in jsonwp mode and Appium just rewrites W3C requests from upstream to jsonwp if needed
     */
    const useAtom = (
        await browser.isDevTools ||
        (
            await browser.isW3C &&
            !browser.isMobile &&
            isListedBrowser
        )
    )

    return useAtom
        ? await browser.execute(isElementDisplayedScript, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId // jsonwp compatible
        } as any as HTMLElement) :
        await this.isElementDisplayed(this.elementId)
}
