import type { Capabilities } from '@wdio/types'

export function getNativeContext({ capabilities, isMobile }:
    { capabilities: WebdriverIO.Capabilities, isMobile: boolean }
): boolean {
    if (!capabilities || typeof capabilities !== 'object' || !isMobile) {
        return false
    }

    const isAppiumAppCapPresent = (capabilities: Capabilities.RequestedStandaloneCapabilities) => {
        const appiumKeys = ['app', 'bundleId', 'appPackage', 'appActivity', 'appWaitActivity', 'appWaitPackage']
        return appiumKeys.some(key => (capabilities as Capabilities.AppiumCapabilities)[key as keyof Capabilities.AppiumCapabilities] !== undefined)
    }
    const isBrowserNameFalse = !!capabilities?.browserName === false
    // @ts-expect-error
    const isAutoWebviewFalse = capabilities?.autoWebview !== true

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
