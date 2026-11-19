import logger from '@wdio/logger'

import type { SwipeOptions, XY } from '../../types.js'
import { calculateSwipeFromTo, getScrollableElement, getSwipeAreaRect, getSwipePercentage, SWIPE_DEFAULTS } from '../../utils/mobile.js'

const log = logger('webdriverio')

/**
 *
 * Swipe in a specific direction within viewport or element for Desktop/Mobile Web <strong>AND</strong> Mobile Native Apps.
 *
 * :::info
 *
 * Swiping for Mobile Native Apps is based on the W3C-actions protocol, simulating a finger press and movement.
 * This is different from the [`mobile: scrollGesture`](https://appium.github.io/appium-uiautomator2-driver/latest/reference/execute-methods/#mobile-scrollgesture) for Android
 * or [`mobile: scroll`](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-scroll) for iOS command which is based on the Appium Driver protocol and is
 * only available for mobile platforms in the NATIVE context.
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
 * :::caution Swiping based on coordinates
 *
 * Avoid using `from` and `to` options unless absolutely necessary. These are device-specific and may not work consistently across devices.
 * Use the `scrollableElement` option for reliable swipes within an element.
 *
 * :::
 *
 * <example>
    :swipe.js
    it('should execute a default swipe', async () => {
        // Default will be a swipe from the bottom to the top, meaning it will swipe UP
        await browser.swipe();
    });
 * </example>
 *
 * <example>
    :swipe.with.options.js
    it('should execute a swipe with options', async () => {
        await browser.swipe({
            direction: 'left',                  // Swipe from right to left
            duration: 5000,                     // Last for 5 seconds
            percent: 0.5,                       // Swipe 50% of the scrollableElement
            scrollableElement: $('~carousel'),  // The element to swipe within
        })
    });
 * </example>
 *
 * @alias element.scrollIntoView
 * @param {object|boolean=} options                   options for `browser.swipe()`. Default for desktop/mobile web: <br/> `{ direction: 'up', duration: 1500, percent: 0.95, scrollableElement: WebdriverIO.Element }`
 * @param {string=}         options.direction         Can be one of `down`, `up`, `left` or `right`, default is `up`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @rowInfo Down    ::<strong>Starting Point:</strong><br/>You place your finger towards the top of the screen.<br/><strong>Movement:</strong><br/>You slide your finger downwards towards the bottom of the screen.<br/><strong>Action:</strong><br/>This also varies by context:<br />- On the home screen or in applications, it typically scrolls the content upwards.<br />- From the top edge, it often opens the notifications panel or quick settings.<br />- In browsers or reading apps, it can be used to scroll through content.
 * @rowInfo Left    ::<strong>Starting Point:</strong><br/>You place your finger on the right side of the screen.<br/><strong>Movement:</strong><br/>You slide your finger horizontally to the left.><br/><strong>Action:</strong><br/>The response to this gesture depends on the application:<br />- It can move to the next item in a carousel or a set of images.<br />- In a navigation context, it might go back to the previous page or close the current view.<br />- On the home screen, it usually switches to the next virtual desktop or screen.
 * @rowInfo Right   ::<strong>Starting Point:</strong><br/>You place your finger on the left side of the screen.<br/><strong>Movement:</strong><br/>You slide your finger horizontally to the right.<br/><strong>Action:</strong><br/>Similar to swiping left, but in the opposite direction:<br />-- It often moves to the previous item in a carousel or gallery.<br />- Can be used to open side menus or navigation drawers in apps.<br />- On the home screen, it typically switches to the previous virtual desktop.
 * @rowInfo Up      ::<strong>Starting Point:</strong><br/>You place your finger towards the bottom of the screen.<br/><strong>Movement:</strong><br/>You slide your finger upwards towards the top of the screen.><br/><strong>Action:</strong><br/>Depending on the context, different actions can occur:<br />- On the home screen or in a list, this usually scrolls the content downwards.<br />- In a full-screen app, it might open additional options or the app drawer.<br />- On certain interfaces, it could trigger a 'refresh' action or open a search bar.
 * @param {number=}         options.duration          The duration in milliseconds for the swipe. Default is `1500` ms. The lower the value, the faster the swipe.
 * @param {Element=}        options.scrollableElement Element that is used to swipe within. If no element is provided it will use the following selector for iOS `-ios predicate string:type == "XCUIElementTypeApplication"` and the following for Android `//android.widget.ScrollView'`. If more elements match the default selector, then by default it will pick the first matching element. <br /> <strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}         options.percent           The percentage of the (default) scrollable element to swipe. This is a value between 0 and 1. Default is `0.95`.<br /><strong>NEVER</strong> swipe from the exact top|bottom|left|right of the screen, you might trigger for example the notification bar or other OS/App features which can lead to unexpected results.<br />This has no effect if `from` and `to` are provided.
 * @rowInfo The below values <strong>ONLY</strong> have an effect if the `scrollableElement` is <strong>NOT</strong> provided, otherwise they are ignored.
 * @param {object=}         options.from              The x and y coordinates of the start of the swipe. If a `scrollableElement` is provided, then these coordinates have no effect.
 * @param {number=}         options.from.x            The x-coordinate of the start of the swipe.
 * @param {number=}         options.from.y            The y-coordinate of the start of the swipe.
 * @param {object=}         options.to                The x and y coordinates of the end of the swipe. If a `scrollableElement` is provided, then these coordinates have no effect.
 * @param {number=}         options.to.x              The x-coordinate of the end of the swipe.
 * @param {number=}         options.to.y              The y-coordinate of the end of the swipe.
 * @uses protocol/execute
 * @type utility
 * @skipUsage
 *
 * @support ["ios","android"]
 */
export async function swipe (
    this: WebdriverIO.Browser,
    options?: SwipeOptions
): Promise<void|unknown> {
    const browser = this

    if (!browser.isNativeContext) {
        throw new Error('The swipe command is only available for mobile platforms in the NATIVE context.')
    }

    let { scrollableElement, from, to } = options || {}

    if (scrollableElement && (from || to)) {
        log.warn('`scrollableElement` is provided, so `from` and `to` will be ignored.')
    }
    if (!from || !to) {
        scrollableElement = scrollableElement || await getScrollableElement(browser)
        const swipePercentage = getSwipePercentage(options?.percent)
        const rect = await getSwipeAreaRect(browser, scrollableElement);
        ({ from, to } = calculateSwipeFromTo({
            direction: options?.direction || SWIPE_DEFAULTS.DIRECTION,
            swipePercentage,
            rect,
        }))
    }

    return w3cSwipe({ browser, duration: options?.duration || SWIPE_DEFAULTS.DURATION, from, to })
}

async function w3cSwipe({ browser, duration, from, to }: { browser: WebdriverIO.Browser, duration: number, from: XY, to: XY }) {
    await browser
        // a. Create the event
        .action('pointer', {
            parameters: { pointerType: browser.isMobile ? 'touch' : 'mouse' }
        })
        // b. Move finger into start position
        .move(from.x, from.y) // This can also be written as .move({ x:from.x, y:from.y }) which allows you to add more options
        // c. Finger comes down into contact with screen
        .down()
        // d. Pause for a little bit
        .pause(10)
        // e. Finger moves to end position
        // IMPORTANT. The default duration, if you don't provide it, is 100ms. This means that the movement will be so fast that it:
        // - might not be registered
        // - might not have the correct result on longer movements.
        // Short durations will move elements on the screen over longer move coordinates very fast.
        .move({ duration: duration, x: to.x, y: to.y })
        // f. Finger gets up, off the screen
        .up()
        // g. Perform the action
        .perform()

    // Add a pause, just to make sure the swipe is done
    // eslint-disable-next-line wdio/no-pause
    return browser.pause(500)
}
