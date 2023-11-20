import { ELEMENT_KEY } from '../../constants.js'
import { getBrowserObject, hasElementId } from '../../utils/index.js'
import isElementDisplayedScript from '../../scripts/isElementDisplayed.js'

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

    return await browser.execute(isElementDisplayedScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    } as any as HTMLElement)
}
