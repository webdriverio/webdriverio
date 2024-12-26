import { getBrowserObject } from '@wdio/utils'
import type { MobileScrollIntoViewOptions, TapOptions } from '../../types.js'

/**
 *
 * Performs a tap gesture on the given element or on given coordinates on the screen.
 * This command differs from the `click` command as it:
 * - can tap on a specific coordinate on the screen (when x and y are set) based on a W3C Action.
 *   The click command can only click on an offset calculated from the center of the element.
 * - uses the native tap gesture for Android (mobile: clickGesture) or iOS (mobile: tap) for natives apps
 *   instead of the WebDriver command which is more reliable.
 * - will, in comparison to the `click` command, automatically scroll to the element for native apps
 *   if it's not within the viewport.
 *
 * <example>
    :tap.example.js
    it('should be able tap an on element on iOS', async () => {
        const contacts = $('~Contacts')
        // opens the Contacts menu on iOS
        await contacts.tap()
    })
 * </example>
 *
 * @param {TapOptions=} options                     Long press options (optional)
 * @param {number=}     options.x                   Number (optional, mandatory if y is set)
 * @param {number=}     options.y                   Number (optional, mandatory if x is set)
 * @param {string=}     options.direction           Can be one of `down`, `up`, `left` or `right`, default is `down`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}     options.maxScrolls          The max amount of scrolls until it will stop searching for the element, default is `10`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {Element=}    options.scrollableElement   Element that is used to scroll within. If no element is provided it will use the following selector for iOS `-ios predicate string:type == "XCUIElementTypeApplication"` and the following for Android `//android.widget.ScrollView'`. If more elements match the default selector, then by default it will pick the first matching element. <br /> <strong>MOBILE-NATIVE-APP-ONLY</strong>
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

    if (
        typeof options !== 'undefined' &&
        (options.x === undefined || options.y === undefined)
    ) {
        throw new TypeError(`If ${options.x !== undefined ? 'x' : 'y'} is set, then ${options.x !== undefined ? 'y' : 'x'} must be set as well.`)
    }

    if (browser.isNativeContext) {
        return await nativeTap(element, browser, options)
    }

    return await webTap(element, browser, options)
}

/**
 * Execute the tap gesture on the given element or coordinates on a mobile browser.
*/
async function webTap(element: WebdriverIO.Element, browser: WebdriverIO.Browser, options?: TapOptions) {
    // If no options are passed, just click the element with the default click
    if (options === undefined) {
        return element.click()
    }

    const { x, y } = options

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

type ExecuteTapOptions = TapOptions & { elementId?: string }

/**
 * Execute the native tap action on the given element or coordinates on a mobile device
 */
async function executeNativeTap(browser: WebdriverIO.Browser, options?: Partial<ExecuteTapOptions>) {
    return await browser.execute(`mobile: ${browser.isIOS ? 'tap' : 'clickGesture'}`, { ...options })
}

/**
 * Execute the tap gesture on the given element or coordinates on a mobile device in the native context
 */
async function nativeTap(element: WebdriverIO.Element, browser: WebdriverIO.Browser, options: Partial<TapOptions> = {}) {
    // When x and y are set then tap on the coordinates on the screen through the mobile command
    if (options.x !== undefined && options.y !== undefined) {
        return executeNativeTap(browser, { x:options.x, y:options.y })
    }

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
