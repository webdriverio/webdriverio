import { getBrowserObject, hasElementId } from '../../utils/index.js'
import isElementDisplayedScript from '../../scripts/isElementDisplayed.js'
import isElementInViewportScript from '../../scripts/isElementInViewport.js'

interface IsDisplayedParams {
    withinViewport?: boolean
}

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
 * WebdriverIO, when conducting browser tests, utilizes a [custom script](https://github.com/webdriverio/webdriverio/blob/59d349ca847950354d02b9e548f60cc50e7871f0/packages/webdriverio/src/scripts/isElementDisplayed.ts)
 * specifically designed to assess the visibility of elements. This script is key in determining whether an
 * element is displayed on the page. Conversely, for native mobile testing scenarios with Appium, WebdriverIO
 * defers to the [`isElementDisplayed`](https://appium.io/docs/en/2.1/reference/interfaces/appium_types.ExternalDriver/#elementdisplayed)
 * command provided by Appium. This command evaluates the visibility of elements using criteria established by the
 * underlying Appium driver, ensuring accurate and driver-specific assessments for mobile applications.
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
    isDisplayedWithinViewport.js
    it('should detect if an element is visible within the viewport', async () => {
        let isDisplayedInViewport = await $('#notDisplayed').isDisplayed({ withinViewport: true });
        console.log(isDisplayedInViewport); // outputs: false

        isDisplayedInViewport = await $('#notVisible').isDisplayed({ withinViewport: true });
        console.log(isDisplayedInViewport); // outputs: false

        isDisplayedInViewport = await $('#notExisting').isDisplayed({ withinViewport: true });
        console.log(isDisplayedInViewport); // outputs: false

        isDisplayedInViewport = await $('#notInViewport').isDisplayed({ withinViewport: true });
        console.log(isDisplayedInViewport); // outputs: false

        isDisplayedInViewport = await $('#zeroOpacity').isDisplayed({ withinViewport: true });
        console.log(isDisplayedInViewport); // outputs: false
    });
 * </example>
 *
 * @alias element.isDisplayed
 * @param {Boolean} [isWithinViewport=false] set to true to check if element is within viewport
 * @return {Boolean} true if element is displayed
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 *
 */
export async function isDisplayed (
    this: WebdriverIO.Element,
    commandParams: IsDisplayedParams = { withinViewport: false }
) {
    const browser = getBrowserObject(this)

    if (!await hasElementId(this)) {
        return false
    }

    /**
     * For mobile sessions with Appium we continue to use the elementDisplayed command
     * as we can't run JS in native apps
     */
    const isNativeApplication = !(browser.capabilities as WebdriverIO.Capabilities).browserName
    if (browser.isMobile && isNativeApplication) {
        /**
         * there is no support yet for checking if an element is displayed within the
         * viewport for native apps. We can only check if it's displayed at all.
         */
        if (commandParams?.withinViewport) {
            throw new Error(
                'Cannot determine element visibility within viewport for native mobile apps ' +
                'as it is not feasible to determine full vertical and horizontal application bounds. ' +
                'In most cases a basic visibility check should suffice.'
            )
        }

        return await this.isElementDisplayed(this.elementId)
    }

    const isDisplayed = await browser.execute(isElementDisplayedScript, this as any as HTMLElement)

    if (isDisplayed && commandParams?.withinViewport) {
        return browser.execute(isElementInViewportScript, this as any as HTMLElement)
    }

    return isDisplayed
}
