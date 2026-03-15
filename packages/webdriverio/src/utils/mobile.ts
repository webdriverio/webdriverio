import logger from '@wdio/logger'

import type { PinchAndZoomOptions } from '../types.js'

const log = logger('webdriver')

/**
 * Returns true if the error indicates that the driver does not know about the
 * requested `mobile:` execute method (old Appium 2 driver). Any other error
 * (wrong params, device disconnected, etc.) should be re-thrown by the caller.
 */
export function isUnknownMethodError(err: unknown): boolean {
    if (!(err instanceof Error)) {
        return false
    }
    const msg = err.message.toLowerCase()
    return msg.includes('unknown method') || msg.includes('unknown command')
}

/**
 * Log a deprecation warning when a mobile command falls back to the legacy
 * Appium protocol endpoint because the driver is too old to support the
 * modern `mobile:` execute replacement.
 *
 * @param mobileCommand   e.g. `'mobile: lock'`
 * @param protocolEndpoint  e.g. `'/appium/device/lock'`
 */
export function logAppiumDeprecationWarning(mobileCommand: string, protocolEndpoint: string): void {
    log.warn(
        `The \`${mobileCommand}\` execute method is not supported by your Appium driver. ` +
        `Falling back to the deprecated \`${protocolEndpoint}\` protocol endpoint. ` +
        `Please upgrade your Appium driver to a version that supports \`${mobileCommand}\`.`
    )
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
