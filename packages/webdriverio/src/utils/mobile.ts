import logger from '@wdio/logger'

import type { ChainablePromiseElement, PinchAndZoomOptions, XY } from '../types.js'
import { MobileScrollDirection } from '../types.js'

const log = logger('webdriverio')

export const SWIPE_DEFAULTS = {
    DIRECTION: MobileScrollDirection.Up,
    DURATION: 1500,
    PERCENT: 0.95,
}

export type SwipeAreaRect = { x: number, y: number, width: number, height: number }

const APPIUM3_UPGRADE_HINT =
    'WebdriverIO 10 requires Appium 3 and a current official driver. ' +
    'Install or upgrade with `npm i -D appium@^3`, then run `appium driver update installed`. ' +
    'Stay on WebdriverIO 9 if you cannot upgrade the server.'

/**
 * Returns true if the error indicates that the driver does not know about the
 * requested `mobile:` execute method (Appium 1/2, an outdated driver, or a
 * current driver that simply does not implement this extension).
 */
function isUnknownMethodError(err: unknown): boolean {
    if (!(err instanceof Error)) {
        return false
    }
    const msg = err.message.toLowerCase()
    return msg.includes('unknown method') || msg.includes('unknown command')
}

/**
 * Run a `mobile:` / platform execute script over classic WebDriver
 * `executeScript` so Appium extensions are not routed through BiDi
 * `scriptCallFunction`. Unknown-method errors become a hard error that
 * names both the upgrade path and the possibility that the current
 * driver simply does not implement the extension.
 */
export async function executeMobile<T = unknown>(
    browser: WebdriverIO.Browser,
    script: string,
    args?: unknown
): Promise<T> {
    try {
        return await browser.executeScript(
            script,
            args === undefined ? [] : [args]
        ) as T
    } catch (err: unknown) {
        if (!isUnknownMethodError(err)) {
            throw err
        }

        const original = err instanceof Error ? err.message : String(err)
        throw new Error(
            `The \`${script}\` execute method is not supported by your Appium driver ` +
            `(${original}). ${APPIUM3_UPGRADE_HINT} ` +
            `If you are already on Appium 3 with current drivers, this platform may not implement \`${script}\`.`
        )
    }
}

export function getNativeContext({ capabilities, isMobile }:
{ capabilities: WebdriverIO.Capabilities, isMobile: boolean }
): boolean {
    if (!capabilities || typeof capabilities !== 'object' || !isMobile) {
        return false
    }

    const isBrowserNameFalse = !!capabilities?.browserName === false
    const isAutoWebviewFalse = !(
        // @ts-expect-error
        capabilities?.autoWebview === true ||
        capabilities['appium:autoWebview'] === true ||
        capabilities['appium:options']?.autoWebview === true ||
        capabilities['lt:options']?.autoWebview === true
    )

    return isBrowserNameFalse && isMobile && isAutoWebviewFalse
}

export function getMobileContext({ capabilities, isAndroid, isNativeContext }:
{ capabilities: WebdriverIO.Capabilities, isAndroid: boolean, isNativeContext: boolean }
): string | undefined {
    return isNativeContext ? 'NATIVE_APP' :
    // Android webviews are always WEBVIEW_<package_name>, Chrome will always be CHROMIUM
    // We can only determine it for Android and Chrome, for all other, including iOS, we return undefined
        isAndroid && capabilities?.browserName?.toLowerCase() === 'chrome' ? 'CHROMIUM' :
            undefined
}

export function calculateAndroidPinchAndZoomSpeed({ browser, duration, scale }:
{ browser: WebdriverIO.Browser, duration: number, scale: number }
): number {
    // @ts-expect-error
    const deviceScreenSize = (browser.capabilities?.deviceScreenSize || '1080x2400').split('x').reduce((a, b) => a * b)
    // Calculate base distance (diagonal of the screen in physical pixels)
    const baseDistance = Math.sqrt(deviceScreenSize)
    // Adjust gesture distance by scale (ensure meaningful gestureDistance even for low scales)
    const gestureDistance = Math.max(baseDistance * Math.abs(scale), baseDistance * 0.1) // Minimum 10% distance
    const durationSeconds = duration / 1000

    return Math.floor(gestureDistance / durationSeconds)
}

export function validatePinchAndZoomOptions({ browser, gesture, options }:
{ browser: WebdriverIO.Browser, gesture: 'pinch' | 'zoom', options: Partial<PinchAndZoomOptions> }
): { scale: number, duration: number } {
    if (typeof options !== 'undefined' && (typeof options !== 'object' || Array.isArray(options))) {
        throw new TypeError('Options must be an object')
    }

    const DEFAULT_SCALE = 0.5
    const DEFAULT_DURATION = browser.isIOS ? 1.5 : 1500
    const MIN_SCALE = 0
    const MAX_SCALE = 1
    const MIN_DURATION_MS = 500
    const MAX_DURATION_MS = 10000
    const { scale: scaleOption, duration: durationOption } = options

    const scale = typeof scaleOption === 'number'
        ? scaleOption >= MIN_SCALE && scaleOption <= MAX_SCALE
            ? scaleOption
            : (() => { throw new Error(`The 'scale' option must be a number between ${MIN_SCALE} and ${MAX_SCALE}`) })()
        : DEFAULT_SCALE
    const duration = typeof durationOption === 'number'
        ? durationOption >= MIN_DURATION_MS && durationOption <= MAX_DURATION_MS
            ? browser.isIOS ? durationOption / 1000 : durationOption
            : (() => { throw new Error(`The 'duration' option must be between ${MIN_DURATION_MS} and ${MAX_DURATION_MS} ms (${MIN_DURATION_MS/1000} and ${MAX_DURATION_MS/1000}  seconds)`) })()
        : DEFAULT_DURATION

    return {
        duration,
        scale: browser.isIOS && gesture === 'zoom' ? scale * 10 : scale,
    }
}

/**
 * Find the default element of a native app that `browser.swipe()` and the native
 * `element.scrollIntoView()` swipe within when no `scrollableElement` is provided.
 */
export async function getScrollableElement(browser: WebdriverIO.Browser): Promise<WebdriverIO.Element> {
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

/**
 * Get the rect of the element a swipe is performed within, that is its position on the screen:
 * - x (position from the left of the screen)
 * - y (position from the top of the screen)
 * - width (width of the element)
 * - height (height of the element)
 */
export async function getSwipeAreaRect(
    browser: WebdriverIO.Browser,
    scrollableElement: WebdriverIO.Element | ChainablePromiseElement
): Promise<SwipeAreaRect> {
    const { x, y, width, height } = await browser.getElementRect(await scrollableElement?.elementId)
    return { x, y, width, height }
}

/**
 * Determine the percentage of the scrollable container to be scrolled, warns
 * and falls back to the default for an invalid value.
 * Never swipe from the exact top|bottom|left|right of the screen, you might trigger
 * the notification bar or other OS/App features.
 */
export function getSwipePercentage(percentage?: number): number {
    if (percentage !== undefined) {
        if (isNaN(percentage)) {
            log.warn('The percentage to swipe should be a number.')
        } else if (percentage < 0 || percentage > 1) {
            log.warn('The percentage to swipe should be a number between 0 and 1.')
        } else {
            return percentage
        }
    }
    return SWIPE_DEFAULTS.PERCENT
}

/**
 * Calculate the start and end coordinates of a swipe in the given direction
 * within the rect of the scrollable element.
 */
export function calculateSwipeFromTo({
    direction,
    swipePercentage,
    rect
}: {
    direction: `${MobileScrollDirection}`,
    /**
     * the percentage of the scrollable container that should be scrolled, see `getSwipePercentage`
     */
    swipePercentage: number,
    rect: SwipeAreaRect
}): { from: XY, to: XY } {
    // Determine the swipe coordinates
    //    We use the rect of the scrollable element to calculate the position of the swipe by determining the
    //    - top
    //    - right
    //    - bottom
    //    - left
    //    of the element. These positions will contain the x and y coordinates on where to put the finger
    const { x, y, width, height } = rect

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

    // Swipe in the given direction
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
