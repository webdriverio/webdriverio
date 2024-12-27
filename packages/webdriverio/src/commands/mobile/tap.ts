import logger from '@wdio/logger'

import { getBrowserObject } from '@wdio/utils'
import type { MobileScrollIntoViewOptions, TapOptions } from '../../types.js'

const log = logger('webdriver')
/**
 *
 * Performs a tap gesture on the given element and will **automatically scroll** if it can't be found.
 *
 * Internally it uses:
 * - the `click` command for Web environments (Chrome/Safari browsers, or hybrid apps)
 * - the Android [`mobile: clickGesture`](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-clickgesture) or iOS [`mobile: tap`](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-tap) for Natives apps
 * This difference makes the `tap` command a more reliable alternative to the `click` command for mobile apps.
 *
 * For Native Apps this command differs from the `click` command as it will <strong>automatically swipe</strong> to the element for native apps by using the `scrollIntoView` command.
 *
 * <example>
    :tap.example.js
    it('should be able to tap an on element', async () => {
        const elem = $('~myElement')
        // It will automatically scroll to the element if it's not already in the viewport
        await elem.tap()
    })
 * </example>
 *
 * <example>
    :tap.scroll.options.example.js
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
 * @param {TapOptions=} options                     Tap options (optional)
 * @param {string=}     options.direction           Can be one of `down`, `up`, `left` or `right`, default is `down`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}     options.maxScrolls          The max amount of scrolls until it will stop searching for the element, default is `10`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {Element=}    options.scrollableElement   Element that is used to scroll within. If no element is provided it will use the following selector for iOS `-ios predicate string:type == "XCUIElementTypeApplication"` and the following for Android `//android.widget.ScrollView'`. If more elements match the default selector, then by default it will pick the first matching element. <br /> <strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @mobileElement
 */
export async function tap(
    this: WebdriverIO.Element,
    options?: TapOptions
) {
    const element = this
    const browser = getBrowserObject(this)

    if (!browser.isMobile) {
        throw new Error('The tap command is only available for mobile platforms.')
    }

    if (
        typeof options !== 'undefined' &&
        (typeof options !== 'object' || Array.isArray(options))
    ) {
        throw new TypeError('Options must be an object.')
    }

    if (browser.isNativeContext) {
        return await nativeTap(element, browser, options)
    }

    if (options) {
        // @ts-expect-error property doesn't exist on LoggerInterface
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
        { ...options, ...(browser.isIOS ? { x: 0, y: 0 } : {}) }
    )
}

/**
 * Execute the tap gesture on the given element on a mobile device in the native context
 */
async function nativeTap(element: WebdriverIO.Element, browser: WebdriverIO.Browser, options: Partial<TapOptions> = {}) {
    try {
        // for native apps we might not have the elementId when an element is not in the viewport
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
