import logger from '@wdio/logger'

import { getBrowserObject } from '@wdio/utils'
import type { MobileScrollIntoViewOptions, TapOptions } from '../../types.js'

const log = logger('webdriver')
/**
 *
 * Performs a tap gesture on:
 * - or the given element. It will **automatically scroll** if it can't be found.
 * - or the screen on a mobile device by providing `x` and `y` coordinates
 *
 * Internally it uses:
 * - Element tap:
 *      - the `click` command for Web environments (Chrome/Safari browsers, or hybrid apps)
 *      - the Android [`mobile: clickGesture`](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-clickgesture)
 * or iOS [`mobile: tap`](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-tap) for Natives apps, including the `scrollIntoView`
 * command for automatic scrolling
 * - Screen tap:
 *      - the `action` command for Web environments (Chrome/Safari browsers, or hybrid apps)
 *      - the Android [`mobile: clickGesture`](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-clickgesture)
 * or iOS [`mobile: tap`](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-tap) for Natives apps
 *
 * This difference makes the `tap` command a more reliable alternative to the `click` command for mobile apps.
 *
 * For Native Apps, this command differs from the `click` command as it will <strong>automatically swipe</strong> to the element using the `scrollIntoView command`,
 * which is not supported for native apps with the `click` command. In hybrid apps or web environments, automatic scrolling is supported for both `click` and `tap` commands.
 *
 * :::info
 *
 * This command only works with the following up-to-date components:
 *  - Appium server (version 2.0.0 or higher)
 *  - `appium-uiautomator2-driver` (for Android)
 *  - `appium-xcuitest-driver` (for iOS)
 *
 * Make sure your local or cloud-based Appium environment is regularly updated to avoid compatibility issues.
 *
 * :::
 *
 *
 * :::caution For Screen taps
 *
 * If you want to tap on a specific coordinate on the screen and you use a screenshot to determine the coordinates, remember that the
 * the coordinates for iOS are based on the device's screen size, and not the screenshot size. The screenshot size is larger due to the device pixel ratio.
 * The average device pixel ratio until the iPhone 8 and the current iPads is 2, for iPhones from the iPhone X the ratio is 3. This means that the screenshot
 * size is 2 or 3 times larger than the device's screen size which means that ff you find the coordinates on the screenshot, divide them by the device pixel
 * ratio to get the correct screen coordinates. For example:
 *
 * ```js
 * const screenshotCoordinates = { x: 600, y: 900 };
 * const dpr = 3; // Example for iPhone 16
 * const screenCoordinates = {
 *     x: screenshotCoordinates.x / dpr,
 *     y: screenshotCoordinates.y / dpr
 * };
 * await browser.tap(screenCoordinates);
 * ```
 *
 * :::
 *
 * <example>
    :element.tap.example.js
    it('should be able to tap an on element', async () => {
        const elem = $('~myElement')
        // It will automatically scroll to the element if it's not already in the viewport
        await elem.tap()
    })
 * </example>
 *
 * <example>
    :element.tap.scroll.options.example.js
    it('should be able to swipe right 3 times in a custom scroll areas to an element and tap on the element', async () => {
        const elem = $('~myElement')
        // Swipe right 3 times in the custom scrollable element to find the element
        await elem.tap({
            direction: 'right',
            maxScrolls: 3,
            scrollableElement: $('#scrollable')
        })
    })
 * </example>
 *
 * <example>
    :screen.tap.example.js
    it('should be able to tap on screen coordinates', async () => {
        await browser.tap({ x: 200, y: 400 })
    })
 * </example>
 *
 * @param {TapOptions=} options                     Tap options (optional)
 * @rowInfo Element tap options
 * @param {number=}     options.x                   Number (optional, mandatory if y is set) <br /><strong>Only for SCREEN tap, not for ELEMENT tap</strong>
 * @param {number=}     options.y                   Number (optional, mandatory if x is set) <br /><strong>Only for SCREEN tap, not for ELEMENT tap</strong>
 * @rowInfo Screen tap options
 * @param {string=}     options.direction           Can be one of `down`, `up`, `left` or `right`, default is `down`. <br /><strong>Only for ELEMENT tap, not for SCREEN tap</strong><br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}     options.maxScrolls          The max amount of scrolls until it will stop searching for the element, default is `10`. <br /><strong>Only for ELEMENT tap, not for SCREEN tap</strong><br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {Element=}    options.scrollableElement   Element that is used to scroll within. If no element is provided it will use the following selector for iOS `-ios predicate string:type == "XCUIElementTypeApplication"` and the following for Android `//android.widget.ScrollView'`. If more elements match the default selector, then by default it will pick the first matching element. <br /><strong>Only for ELEMENT tap, not for SCREEN tap</strong><br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @skipUsage
 */
export async function tap(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    options?: TapOptions
) {
    const isElement = (this as WebdriverIO.Element).selector !== undefined
    const element = isElement ? (this as WebdriverIO.Element) : null
    const browser = isElement ? getBrowserObject(this) : (this as WebdriverIO.Browser)

    if (!browser.isMobile) {
        throw new Error('The tap command is only available for mobile platforms.')
    }

    validateTapOptions(options)

    if (element) {
        return await elementTap(browser, element, options)
    }

    if (!options || options.x === undefined || options.y === undefined) {
        throw new Error('The tap command requires x and y coordinates to be set for screen taps.')
    }

    return await screenTap(browser, options)
}

/**
 * Helper to validate the tap options
 */
function validateTapOptions(options?: TapOptions): void {
    if (options) {
        if (typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('Options must be an object.')
        }

        const { x, y, ...otherArgs } = options

        if ((x === undefined) !== (y === undefined)) {
            throw new TypeError(`If ${x !== undefined ? 'x' : 'y'} is set, then ${x !== undefined ? 'y' : 'x'} must also be set.`)
        }
        if (x !== undefined && y !== undefined && Object.keys(otherArgs).length > 0) {
            throw new TypeError(`If x and y are provided, no other arguments are allowed. Found: ${Object.keys(otherArgs).join(', ')}`)
        }

        const invalidCoordinates = []
        if (x !== undefined && x < 0) {
            invalidCoordinates.push('x')

        }
        if (y !== undefined && y < 0) {
            invalidCoordinates.push('y')
        }
        if (invalidCoordinates.length > 0) {
            throw new TypeError(`The ${invalidCoordinates.join(' and ')} value${invalidCoordinates.length > 1 ? 's' : ''} must be positive.`)
        }
    }
}

/**
 * Execute the tap gesture on the given element on a mobile device
 */
async function elementTap(browser: WebdriverIO.Browser, element: WebdriverIO.Element, options?: TapOptions) {
    if (browser.isNativeContext) {
        return await nativeTap(element, browser, options)
    }

    if (options) {
        log.warn('The options object is not supported in Web environments and will be ignored.')
    }

    return await webTap(element)
}

/**
 * Execute the tap gesture on the given element on a mobile browser.
*/
async function webTap(element: WebdriverIO.Element) {
    return element.click()
}

type ExecuteTapOptions = TapOptions & { elementId?: string }

/**
 * Execute the native tap action on the given element on a mobile device
 */
async function executeNativeTap(browser: WebdriverIO.Browser, options?: Partial<ExecuteTapOptions>) {
    return await browser.execute(
        `mobile: ${browser.isIOS ? 'tap' : 'clickGesture'}`,
        { ...(browser.isIOS ? { x: 0, y: 0 } : {}), ...options }
    )
}

/**
 * Execute the tap gesture on the given element on a mobile device in the native context
 */
async function nativeTap(element: WebdriverIO.Element, browser: WebdriverIO.Browser, options: Partial<TapOptions> = {}) {
    try {
        // for native apps we might not have the elementId when an element is not in the viewport
        // so we throw an error and try to scroll into view
        if (!element.elementId) {
            throw new Error('no such element')
        }

        return await executeNativeTap(browser, { elementId: element.elementId })
    } catch (error) {
        let err = error as Error
        if (typeof error === 'string') {
            err = new Error(error)
        }
        if (!err.message.includes('no such element')) {
            // we only apply the scrollIntoView when the elementId is not available
            // so that the middleware can handle any other errors
            throw err
        }
        const scrollIntoViewOptions: MobileScrollIntoViewOptions = Object.fromEntries(
            Object.entries({
                direction: options?.direction,
                maxScrolls: options?.maxScrolls,
                scrollableElement: options?.scrollableElement,
            }).filter(([_, value]) => value !== undefined)
        )
        try {
            await element.scrollIntoView(scrollIntoViewOptions)

            return await executeNativeTap(browser, { elementId: element.elementId })
        } catch (scrollError) {
            // We don't want to overcomplicate the error handling from the scrollIntoView by providing
            // extra arguments to the scrollIntoView method. Instead, we throw a more tap user-friendly error
            let err = scrollError as Error
            if (typeof scrollError === 'string') {
                err = new Error(scrollError)
            }
            if (err.message.includes('Element not found within scroll limit of')) {
                throw new Error(`Element not found within the automatic 'tap' scroll limit of ${scrollIntoViewOptions?.maxScrolls || '10'} scrolls by scrolling "${scrollIntoViewOptions?.direction || 'down'}". ` +
                    `The 'tap' methods will automatically scroll if it can't find the element. It might be that 'direction|maxScrolls|scrollableElement' are not correct. You can change change them like this:

await elem.tap({
    direction: 'left' // possible options are: 'up|down|left|right'
    maxScrolls: 15,
    scrollableElement: $('#scrollable'),
});

                `)
            } else if (err.message.includes('Default scrollable element')) {
                const match = err.message.match(/Default scrollable element '(.*?)' was not found/)
                const scrollableElement = match?.[1] || 'unknown-scrollable-element'

                throw new Error(`The 'tap' method tried to automatically scroll to the element but couldn't find the default scrollable element. '${scrollableElement}' ` +
                    `If needed you can provide a custom scrollable element, together with the 'direction' and the 'maxScrolls' like this:

await elem.tap({
    scrollableElement: $('#scrollable'),
});

                `)
            }

            throw err
        }

    }
}

/**
 * Execute the tap gesture on the screen on a mobile device.
 */
async function screenTap(browser: WebdriverIO.Browser, options: TapOptions) {
    const { x, y } = options

    if (browser.isNativeContext) {
        return await executeNativeTap(browser, options)
    }

    return await browser.action(
        'pointer', {
            parameters: { pointerType: 'touch' }
        })
        .move({ x, y })
        .down({ button: 0 })
        .pause(10)
        .up({ button: 0 })
        .perform()
}
