import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'

import isElementInViewportScript from '../../scripts/isElementInViewport.js'

/**
 *
 * Return true if the selected DOM-element found by given selector is partially displayed and within the viewport.
 *
 * <example>
    :index.html
    <div id="noSize"></div>
    <div id="noSizeWithContent">Hello World!</div>
    <div id="notDisplayed" style="width: 10px; height: 10px; display: none"></div>
    <div id="notVisible" style="width: 10px; height: 10px; visibility: hidden"></div>
    <div id="zeroOpacity" style="width: 10px; height: 10px; opacity: 0"></div>
    <div id="notInViewport" style="width: 10px; height: 10px; position:fixed; top: 999999; left: 999999"></div>
    :isDisplayedInViewport.js
    :isDisplayed.js
    it('should detect if an element is displayed', async () => {
        elem = await $('#notExisting');
        isDisplayedInViewport = await elem.isDisplayedInViewport();
        console.log(isDisplayedInViewport); // outputs: false

        let elem = await $('#noSize');
        let isDisplayedInViewport = await elem.isDisplayedInViewport();
        console.log(isDisplayedInViewport); // outputs: false

        let elem = await $('#noSizeWithContent');
        let isDisplayedInViewport = await elem.isDisplayedInViewport();
        console.log(isDisplayedInViewport); // outputs: true

        let elem = await $('#notDisplayed');
        let isDisplayedInViewport = await elem.isDisplayedInViewport();
        console.log(isDisplayedInViewport); // outputs: false

        elem = await $('#notVisible');
        isDisplayedInViewport = await elem.isDisplayedInViewport();
        console.log(isDisplayedInViewport); // outputs: false

        elem = await $('#zeroOpacity');
        isDisplayedInViewport = await elem.isDisplayedInViewport();
        console.log(isDisplayedInViewport); // outputs: false

        elem = await $('#notInViewport');
        isDisplayedInViewport = await elem.isDisplayedInViewport();
        console.log(isDisplayedInViewport); // outputs: false
    });
 * </example>
 *
 * @alias element.isDisplayedInViewport
 * @return {Boolean}            true if element(s)* [is|are] displayed
 * @uses protocol/selectorExecute, protocol/timeoutsAsyncScript
 * @type state
 *
 */
export async function isDisplayedInViewport (this: WebdriverIO.Element) {
    if (!await this.isDisplayed()) {
        return false
    }

    const browser = getBrowserObject(this)
    return browser.execute(isElementInViewportScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as any as HTMLElement)
}
