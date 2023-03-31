import type { Capabilities } from '@wdio/types'

import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject, hasElementId } from '../../utils/index.js'
import isElementDisplayedScript from '../../scripts/isElementDisplayed.js'

const noW3CEndpoint = ['microsoftedge', 'msedge', 'safari', 'chrome', 'safari technology preview']

/**
 *
 * Return true if the selected DOM-element is displayed.
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
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isDisplayed.js
    it('should detect if an element is displayed', async () => {
        let elem = await $('#notDisplayed');
        let isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = await $('#notVisible');

        isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = await $('#notExisting');
        isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: false

        elem = await $('#notInViewport');
        isDisplayed = await elem.isDisplayed();
        console.log(isDisplayed); // outputs: true

        elem = await $('#zeroOpacity');
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
            noW3CEndpoint.includes((browser.capabilities as Capabilities.Capabilities).browserName?.toLowerCase()!)
        )
    )

    return useAtom
        ? await browser.execute(isElementDisplayedScript, {
            [ELEMENT_KEY]: this.elementId, // w3c compatible
            ELEMENT: this.elementId // jsonwp compatible
        } as any as HTMLElement) :
        await this.isElementDisplayed(this.elementId)
}
