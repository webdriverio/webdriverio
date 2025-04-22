import logger from '@testplane/wdio-logger'

import type { ChainablePromiseElement, SwipeOptions, XY } from '../../types.js'
import { MobileScrollDirection } from '../../types.js'

const log = logger('webdriverio')
const SWIPE_DEFAULTS = {
    DIRECTION: MobileScrollDirection.Up,
    DURATION: 1500,
    PERCENT: 0.95,
}

/**
 *
 * Swipe in a specific direction within viewport or element for Desktop/Mobile Web <strong>AND</strong> Mobile Native Apps.
 *
 * :::info
 *
 * Swiping for Mobile Native Apps is based on the W3C-actions protocol, simulating a finger press and movement.
 * This is different from the [`mobile: scrollGesture`](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-scrollgesture) for Android
 * or [`mobile: scroll`](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-scroll) for iOS command which is based on the Appium Driver protocol and is
 * only available for mobile platforms in the NATIVE context.
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
 * @param {object|boolean=} options                   options for `Element.scrollIntoView()`. Default for desktop/mobile web: <br/> `{ block: 'start', inline: 'nearest' }` <br /> Default for Mobile Native App <br /> `{ maxScrolls: 10, scrollDirection: 'down' }`
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
        scrollableElement = scrollableElement || await getScrollableElement(browser);
        ({ from, to } = await calculateFromTo({
            browser,
            direction: options?.direction || SWIPE_DEFAULTS.DIRECTION,
            percentage: options?.percent,
            scrollableElement,
        }))
    }

    return w3cSwipe({ browser, duration: options?.duration || SWIPE_DEFAULTS.DURATION, from, to })
}

async function calculateFromTo({
    browser,
    direction,
    percentage,
    scrollableElement
}: {
    browser: WebdriverIO.Browser,
    direction: `${MobileScrollDirection}`,
    percentage?: number,
    scrollableElement: WebdriverIO.Element | ChainablePromiseElement<WebdriverIO.Element>
    }): Promise<{ from: XY, to: XY }> {
    // 1. Determine the percentage of the scrollable container to be scrolled
    // The swipe percentage is the percentage of the scrollable container that should be scrolled
    // Never swipe from the exact top|bottom|left|right of the screen, you might trigger the notification bar or other OS/App features
    let swipePercentage = SWIPE_DEFAULTS.PERCENT

    if (percentage !== undefined) {
        if (isNaN(percentage)) {
            log.warn('The percentage to swipe should be a number.')
        } else if (percentage < 0 || percentage > 1) {
            log.warn('The percentage to swipe should be a number between 0 and 1.')
        } else {
            swipePercentage = percentage
        }
    }
    // 2. Determine the swipe coordinates
    //    When we get the element rect we get the position of the element on the screen based on the
    //    - x (position from the left of the screen)
    //    - y (position from the top of the screen)
    //    - width (width of the element)
    //    - height (height of the element)
    //    We can use this to calculate the position of the swipe by determining the
    //    - top
    //    - right
    //    - bottom
    //    - left
    //    of the element. These positions will contain the x and y coordinates on where to put the finger
    const { x, y, width, height } = await browser.getElementRect(await scrollableElement?.elementId)

    // calculate the offset
    const verticalOffset = height - height * swipePercentage
    const horizontalOffset = width - width * swipePercentage

    // It's always advisable to swipe from the center of the element.
    const scrollRectangles = {
        top: { x: Math.round(x + width / 2), y: Math.round(y + verticalOffset / 2) },
        right: { x: Math.round(x + width - horizontalOffset / 2), y: Math.round(y + height / 2) },
        bottom: { x: Math.round(x + width / 2), y: Math.round(y + height - verticalOffset / 2 ) },
        left: { x: Math.round(x + horizontalOffset / 2), y: Math.round(y + height / 2) },
    }

    // 3. Swipe in the given direction
    let from: XY
    let to: XY

    switch (direction) {
    case MobileScrollDirection.Down:
        from = scrollRectangles.top
        to = scrollRectangles.bottom
        break
    case MobileScrollDirection.Left:
        from = scrollRectangles.right
        to= scrollRectangles.left
        break
    case MobileScrollDirection.Right:
        from = scrollRectangles.left
        to = scrollRectangles.right
        break
    case MobileScrollDirection.Up:
        from = scrollRectangles.bottom
        to = scrollRectangles.top
        break
    default:
        throw new Error(`Unknown direction: ${direction}`)
    }

    return { from, to }
}

async function getScrollableElement( browser: WebdriverIO.Browser): Promise<WebdriverIO.Element> {
    const defaultAndroidSelector = '//android.widget.ScrollView'
    const defaultIosSelector = '-ios predicate string:type == "XCUIElementTypeApplication"'
    const selector = browser.isIOS
        ? // For iOS, we need to find the application element, if we can't find it, we should throw an error
        defaultIosSelector
        : // There is always a scrollview for Android or, if this fails we should throw an error
        defaultAndroidSelector
    // Not sure why we need to do this, but it seems to be necessary
    const scrollableElements = (await browser.$$(
        selector
    )) as unknown as WebdriverIO.Element[]

    if (scrollableElements.length > 0) {
        return scrollableElements[0]
    }

    throw new Error(
        `Default scrollable element '${browser.isIOS ? defaultIosSelector : defaultAndroidSelector}' was not found. Our advice is to provide a scrollable element like this:

await browser.swipe({ scrollableElement: $('#scrollable') });

        `
    )
}

async function w3cSwipe({ browser, duration, from, to }: {browser: WebdriverIO.Browser, duration: number, from: XY, to: XY}) {
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
