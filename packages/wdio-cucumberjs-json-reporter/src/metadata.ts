import { browser } from '@wdio/globals'

import { NOT_KNOWN } from './constants.js'
import type { AppData, BrowserData, MetadataObject, cjson_metadata } from './types.js'
import type {
    DesiredCapabilitiesExtended,
    RunnerStatsExtended,
    W3CCapabilitiesExtended,
    WebdriverIOExtended,
} from './types/wdio.js'

export class Metadata {
    /**
     * Determine the metadata that needs to be added
     */
    public determineMetadata(data: RunnerStatsExtended): MetadataObject {
        const currentCapabilities = data.capabilities as WebdriverIO.Capabilities
        const optsCaps = browser.requestedCapabilities as W3CCapabilitiesExtended
        const currentConfigCapabilities = data?.capabilities as DesiredCapabilitiesExtended
        const w3cCaps: cjson_metadata = (data.capabilities)
            ? Object.prototype.hasOwnProperty.call(data.capabilities, 'cjson:metadata')
                // Fixes: https://github.com/webdriverio-community/wdio-cucumberjs-json-reporter/issues/73
                ? (data.capabilities as DesiredCapabilitiesExtended)['cjson:metadata'] as cjson_metadata
                // Fallback
                : (browser as WebdriverIOExtended)?.requestedCapabilities?.['cjson:metadata'] as cjson_metadata
            : {}
        const metadata: cjson_metadata = (currentConfigCapabilities as W3CCapabilitiesExtended)?.['cjson:metadata']
            || w3cCaps // When an app is used to test
            || (optsCaps as DesiredCapabilitiesExtended)?.['cjson:metadata'] // devtools
            || {} as cjson_metadata

        // When an app is used to test, else a browser
        const instanceData: AppData | BrowserData = (currentConfigCapabilities?.app || metadata?.app)
            ? this.determineAppData(currentConfigCapabilities, metadata)
            : this.determineBrowserData(currentCapabilities, metadata)

        return <MetadataObject>{
            ...instanceData,
            device: this.determineDeviceName(metadata, currentConfigCapabilities),
            platform: {
                name: this.determinePlatformName(metadata, currentCapabilities),
                version: this.determinePlatformVersion(metadata, currentCapabilities),
            },
        }
    }

    /**
     * Determine the device name
     */
    public determineDeviceName(metadata: cjson_metadata, currentConfigCapabilities: DesiredCapabilitiesExtended): string {
        return (metadata?.device || currentConfigCapabilities?.['cjson:metadata']?.device || `Device name ${NOT_KNOWN}`)
    }

    /**
     * Determine the platform name
     */
    public determinePlatformName(metadata: cjson_metadata, currentCapabilities: WebdriverIO.Capabilities): string {
        const currentPlatformName = currentCapabilities?.platformName
            ? currentCapabilities?.platformName.includes('mac')
                ? 'osx'
                : currentCapabilities.platformName.includes('windows')
                    ? 'windows'
                    : currentCapabilities?.platformName
            : `Platform name ${NOT_KNOWN}`
        return (metadata.platform && metadata?.platform?.name)
            ? metadata.platform?.name
            : currentPlatformName
    }

    /**
     * Determine the platform version
     */
    public determinePlatformVersion(metadata: cjson_metadata, currentCapabilities?: WebdriverIO.Capabilities): string {
        if (metadata && metadata.platform && metadata.platform?.version) {
            return metadata.platform.version
        }
        if (currentCapabilities?.['appium:platformVersion']) {
            return currentCapabilities?.['appium:platformVersion']
        }
        return `Version ${NOT_KNOWN}`
    }

    /**
     * Determine the app data
     */
    public determineAppData(currentConfigCapabilities: DesiredCapabilitiesExtended, metadata: cjson_metadata): AppData {
        const metaAppName: string = (metadata?.app && metadata.app?.name) ? metadata?.app?.name : 'No metadata.app.name available'
        const metaAppVersion: string = (metadata?.app && metadata.app.version) ? metadata.app.version : 'No metadata.app.version available'
        const appPath = currentConfigCapabilities.app || metaAppName
        const appName = appPath.substring(appPath.replace('\\', '/').lastIndexOf('/')).replace('/', '')

        return {
            app: {
                name: appName,
                version: metaAppVersion,
            },
        }
    }

    /**
     * Determine the browser data
     */
    public determineBrowserData(currentCapabilities: WebdriverIO.Capabilities, metadata: cjson_metadata): BrowserData {
        const browserName = currentCapabilities?.browserName
            || ((metadata && metadata?.browser && metadata.browser?.name) ? metadata?.browser?.name : 'No metadata.browser.name available')
        const browserVersion = currentCapabilities?.browserVersion
            || ((metadata && metadata?.browser && metadata?.browser?.version) ? metadata?.browser?.version : 'No metadata.browser.version available')

        return <BrowserData>{
            browser: {
                name: browserName,
                version: browserVersion,
            }
        }
    }
}
