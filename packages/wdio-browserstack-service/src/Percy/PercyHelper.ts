// ======= Percy helper methods start =======

import type { Capabilities } from '@wdio/types'
import type { BrowserstackConfig, UserConfig } from '../types'

import type { Options } from '@wdio/types'

import { PercyLogger } from './PercyLogger'
import Percy from './Percy'

export const startPercy = async (options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig): Promise<Percy> => {
    PercyLogger.debug('Starting percy')
    const percy = new Percy(options, config, bsConfig)
    const response = await percy.start()
    if (response) {
        return percy
    }
    return ({} as Percy)
}

export const stopPercy = async (percy: Percy) => {
    PercyLogger.debug('Stopping percy')
    return percy.stop()
}

export const getBestPlatformForPercySnapshot = (capabilities?: Capabilities.RemoteCapabilities) : any => {
    try {
        const percyBrowserPreference: any = { 'chrome': 0, 'firefox': 1, 'edge': 2, 'safari': 3 }

        let bestPlatformCaps: any = null
        let bestBrowser: any = null

        if (Array.isArray(capabilities)) {
            capabilities
                .flatMap((c: Capabilities.DesiredCapabilities | Capabilities.MultiRemoteCapabilities) => {
                    if (Object.values(c).length > 0 && Object.values(c).every(c => typeof c === 'object' && c.capabilities)) {
                        return Object.values(c).map((o: Options.WebdriverIO) => o.capabilities)
                    }
                    return c as (Capabilities.DesiredCapabilities)
                }).forEach((capability: Capabilities.DesiredCapabilities) => {
                    let currBrowserName = capability.browserName
                    if (capability['bstack:options']) {
                        currBrowserName = capability['bstack:options'].browserName || currBrowserName
                    }
                    if (!bestBrowser || !bestPlatformCaps || (bestPlatformCaps.deviceName || bestPlatformCaps['bstack:options']?.deviceName)) {
                        bestBrowser = currBrowserName
                        bestPlatformCaps = capability
                    } else if (currBrowserName && percyBrowserPreference[currBrowserName.toLowerCase()] < percyBrowserPreference[bestBrowser.toLowerCase()]) {
                        bestBrowser = currBrowserName
                        bestPlatformCaps = capability
                    }
                })
            return bestPlatformCaps
        } else if (typeof capabilities === 'object') {
            Object.entries(capabilities as Capabilities.MultiRemoteCapabilities).forEach(([, caps]) => {
                let currBrowserName = (caps.capabilities as Capabilities.Capabilities).browserName
                if ((caps.capabilities as Capabilities.Capabilities)['bstack:options']) {
                    currBrowserName = (caps.capabilities as Capabilities.Capabilities)['bstack:options']?.browserName || currBrowserName
                }
                if (!bestBrowser || !bestPlatformCaps || (bestPlatformCaps.deviceName || bestPlatformCaps['bstack:options']?.deviceName)) {
                    bestBrowser = currBrowserName
                    bestPlatformCaps = (caps.capabilities as Capabilities.Capabilities)
                } else if (currBrowserName && percyBrowserPreference[currBrowserName.toLowerCase()] < percyBrowserPreference[bestBrowser.toLowerCase()]) {
                    bestBrowser = currBrowserName
                    bestPlatformCaps = (caps.capabilities as Capabilities.Capabilities)
                }
            })
            return bestPlatformCaps
        }
    } catch (err: unknown) {
        PercyLogger.error(`Error while trying to determine best platform for Percy snapshot ${err}`)
        return null
    }
}
