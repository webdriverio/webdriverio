import type { Capabilities } from '@wdio/types'
import type { PinchAndZoomOptions } from '../types.js'

const appiumKeys = ['app', 'bundleId', 'appPackage', 'appActivity', 'appWaitActivity', 'appWaitPackage'] as const
type AppiumKeysType = typeof appiumKeys[number]

export function getNativeContext({ capabilities, isMobile }:
{ capabilities: WebdriverIO.Capabilities, isMobile: boolean }
): boolean {
    if (!capabilities || typeof capabilities !== 'object' || !isMobile) {
        return false
    }

    const isAppiumAppCapPresent = (capabilities: Capabilities.RequestedStandaloneCapabilities) => {
        return appiumKeys.some((key) => (
            (capabilities as Capabilities.AppiumCapabilities)[key as keyof Capabilities.AppiumCapabilities] !== undefined ||
            (capabilities as WebdriverIO.Capabilities)['appium:options']?.[key as AppiumKeysType] !== undefined ||
            (capabilities as WebdriverIO.Capabilities)['lt:options']?.[key as AppiumKeysType] !== undefined
        ))
    }
    const isBrowserNameFalse = !!capabilities?.browserName === false
    const isAutoWebviewFalse = !(
        // @ts-expect-error
        capabilities?.autoWebview === true ||
        capabilities['appium:autoWebview'] === true ||
        capabilities['appium:options']?.autoWebview === true ||
        capabilities['lt:options']?.autoWebview === true
    )

    return isBrowserNameFalse && isAppiumAppCapPresent(capabilities) && isAutoWebviewFalse
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
