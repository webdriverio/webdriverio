import { getBrowserObject } from '@wdio/utils'

import { hasElementId } from '../../utils/index.js'
import isElementDisplayedLegacyScript from '../../scripts/isElementDisplayed.js'
import isElementInViewportScript from '../../scripts/isElementInViewport.js'

/**
 *
 * Return true if the selected DOM-element is displayed (even when the element is outside the viewport). It is using
 * the [`checkVisibility`](https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility#visibilityproperty)
 * method provided by the browser to determine if an element is being displayed or not. Since WebdriverIO acts as a
 * real user, the default values for the `contentVisibilityAuto`, `opacityProperty`, and `visibilityProperty` flags
 * are set to `true` to default to a more strict behavior. This means that the command will check if the element is
 * visible due to the value of its `content-visibility`, `opacity`, and `visibility` properties.
 *
 * If you want to also verify that the element is also within the viewport, provide the `withinViewport` flag to the command.
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
 * @param {Boolean} [withinViewport=false] `true` to check if the element is within the viewport. `false` by default.
 * @param {Boolean} [contentVisibilityAuto=true] `true` to check if the element content-visibility property has (or inherits) the value auto, and it is currently skipping its rendering. `true` by default.
 * @param {Boolean} [opacityProperty=true] `true` to check if the element opacity property has (or inherits) a value of 0. `true` by default.
 * @param {Boolean} [visibilityProperty=true] `true` to check if the element is invisible due to the value of its visibility property. `true` by default.
 * @return {Boolean} true if element is displayed
 * @uses protocol/elements, protocol/elementIdDisplayed
 * @type state
 */

export async function isDisplayed (
    this: WebdriverIO.Element,
    commandParams: IsDisplayedParams = DEFAULT_PARAMS
) {
    const browser = getBrowserObject(this)

    if (!await hasElementId(this)) {
        return false
    }

    /**
     * For mobile sessions with Appium we continue to use the elementDisplayed command
     * as we can't run JS in native apps
     */
    if (browser.isMobile && (browser.isNativeContext || browser.isWindowsApp || browser.isMacApp)) {
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

    let hadToFallback = false
    const [isDisplayed, displayProperty] = await Promise.all([
        browser.execute(function checkVisibility (elem, params) {
            return elem.checkVisibility(params)
        }, this as unknown as HTMLElement, commandParams).catch((err) => {
            /**
             * Fallback to legacy script if checkVisibility is not available
             */
            if (err.message.includes('checkVisibility is not a function')) {
                hadToFallback = true
                return browser.execute(isElementDisplayedLegacyScript, this as unknown as HTMLElement)
            }
            throw err
        }),
        /**
         * don't fail if element is not existing
         */
        this.getCSSProperty('display').catch(() => ({ value: '' }))
    ])

    /**
     * If the element is displayed with `display: contents` we need to recheck
     * the visibility as the element itself is not visible but its children are
     * (if there are any). Hence, we run the legacy script for it.
     */
    const hasDisplayContentsCSSProperty = displayProperty.value === 'contents'
    const shouldRecheckContentVisibility = !hadToFallback && hasDisplayContentsCSSProperty
    const finalResponse = shouldRecheckContentVisibility
        ? await browser.execute(isElementDisplayedLegacyScript, this as unknown as HTMLElement).catch(() => false)
        : isDisplayed

    if (finalResponse && commandParams?.withinViewport) {
        return browser.execute(isElementInViewportScript, this as unknown as HTMLElement)
    }

    return finalResponse
}

const DEFAULT_PARAMS: IsDisplayedParams = {
    withinViewport: false,
    contentVisibilityAuto: true,
    opacityProperty: true,
    visibilityProperty: true
}

interface IsDisplayedParams {
    /**
     * `true` to check if the element is within the viewport. false by default.
     */
    withinViewport?: boolean
    /**
     * `true` to check if the element content-visibility property has (or inherits) the value auto,
     * and it is currently skipping its rendering. `true` by default.
     * @default true
     */
    contentVisibilityAuto?: boolean
    /**
     * `true` to check if the element opacity property has (or inherits) a value of 0. `true` by default.
     * @default true
     */
    opacityProperty?: boolean
    /**
     * `true` to check if the element is invisible due to the value of its visibility property. `true` by default.
     * @default true
     */
    visibilityProperty?: boolean
}
