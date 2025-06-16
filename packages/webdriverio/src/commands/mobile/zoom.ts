import { getBrowserObject } from '@wdio/utils'
import type { PinchAndZoomOptions } from '../../types.js'
import { calculateAndroidPinchAndZoomSpeed, validatePinchAndZoomOptions } from '../../utils/mobile.js'

/**
 *
 * Performs a zoom gesture on the given element on the screen.
 *
 * :::info
 *
 * Zooming is done based on native mobile gestures. It is only supported for the following drivers:
 * - [appium-uiautomator2-driver](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-pinchopengesture) for Android
 * - [appium-xcuitest-driver](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-pinch) for iOS
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
 * <example>
    :zoom.js
    it('should demonstrate a zoom on Google maps', async () => {
        const mapsElement = $('//*[@resource-id="com.google.android.apps.maps:id/map_frame"]')
        // Zoom with the default duration scale
        await mapsElement.zoom()
        // Zoom with a custom duration and scale
        await mapsElement.zoom({ duration: 4000, scale: 0.9 })
    })
 * </example>
 *
 * @alias element.zoom
 * @param {PinchAndZoomOptions=}    options           Zoom options (optional)
 * @param {number=}                 options.duration  The duration in millisecond of how fast the zoom should be executed, minimal is 500 ms and max is 10000 ms. The default is 1500 ms (1.5 seconds) (optional)
 * @param {number=}                 options.scale     The scale of how big the zoom should be according to the screen. Valid values must be float numbers in range 0..1, where 1.0 is 100% (optional)
 * @mobileElement
 */
export async function zoom(
    this: WebdriverIO.Element,
    options: Partial<PinchAndZoomOptions> = {}
) {
    const browser = getBrowserObject(this)

    if (!browser.isMobile) {
        throw new Error('The zoom command is only available for mobile platforms.')
    }

    const { duration, scale } = validatePinchAndZoomOptions({ browser, gesture: 'zoom', options })

    const gestureConfig = browser.isIOS
        ? {
            elementId: await this.elementId,
            scale: scale,
            velocity: duration,
        }
        : {
            elementId: await this.elementId,
            percent: scale,
            speed: calculateAndroidPinchAndZoomSpeed({ browser, duration, scale }),
        }

    return browser.execute(browser.isIOS ? 'mobile: pinch' : 'mobile: pinchOpenGesture', gestureConfig)
}
