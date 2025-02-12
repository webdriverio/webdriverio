// ======= Percy helper methods start =======

import type { Capabilities } from '@wdio/types'
import type { BrowserstackConfig, UserConfig } from '../types.js'

import type { Options } from '@wdio/types'

import { PercyLogger } from './PercyLogger.js'
import Percy from './Percy.js'

export const startPercy = async (options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig): Promise<Percy|undefined> => {
    PercyLogger.debug('Starting percy')
    const percy = new Percy(options, config, bsConfig)
    const response = await percy.start()
    if (response) {
        return percy
    }
    return undefined
}

export const stopPercy = async (percy: Percy) => {
    PercyLogger.debug('Stopping percy')
    return percy.stop()
}

export const getBestPlatformForPercySnapshot = (capabilities?: Capabilities.TestrunnerCapabilities) => {
    try {
        const percyBrowserPreference = { 'chrome': 0, 'firefox': 1, 'edge': 2, 'safari': 3 }

        let bestPlatformCaps: WebdriverIO.Capabilities | undefined
        let bestBrowser: string | undefined

        if (Array.isArray(capabilities)) {
            capabilities
                .flatMap((c) => {
                    if ('alwaysMatch' in c) {
                        return c.alwaysMatch as WebdriverIO.Capabilities
                    }

                    if (Object.values(c).length > 0 && Object.values(c).every(c => typeof c === 'object' && c.capabilities)) {
                        return Object.values(c).map((o) => o.capabilities) as WebdriverIO.Capabilities[]
                    }
                    return c as WebdriverIO.Capabilities
                }).forEach((capability: WebdriverIO.Capabilities) => {
                    let currBrowserName = capability.browserName
                    if (capability['bstack:options']) {
                        currBrowserName = capability['bstack:options'].browserName || currBrowserName
                    }
                    // @ts-expect-error
                    if (!bestBrowser || !bestPlatformCaps || (bestPlatformCaps.deviceName || bestPlatformCaps['bstack:options']?.deviceName)) {
                        bestBrowser = currBrowserName
                        bestPlatformCaps = capability
                    } else if (currBrowserName && percyBrowserPreference[currBrowserName.toLowerCase() as keyof typeof percyBrowserPreference] < percyBrowserPreference[bestBrowser.toLowerCase() as keyof typeof percyBrowserPreference]) {
                        bestBrowser = currBrowserName
                        bestPlatformCaps = capability
                    }
                })
            return bestPlatformCaps
        } else if (typeof capabilities === 'object') {
            Object.entries(capabilities as Capabilities.RequestedMultiremoteCapabilities).forEach(([, caps]) => {
                let currBrowserName = (caps.capabilities as WebdriverIO.Capabilities).browserName
                if ((caps.capabilities as WebdriverIO.Capabilities)['bstack:options']) {
                    currBrowserName = (caps.capabilities as WebdriverIO.Capabilities)['bstack:options']?.browserName || currBrowserName
                }
                // @ts-expect-error
                if (!bestBrowser || !bestPlatformCaps || (bestPlatformCaps.deviceName || bestPlatformCaps['bstack:options']?.deviceName)) {
                    bestBrowser = currBrowserName
                    bestPlatformCaps = (caps.capabilities as WebdriverIO.Capabilities)
                } else if (currBrowserName && percyBrowserPreference[currBrowserName.toLowerCase() as keyof typeof percyBrowserPreference] < percyBrowserPreference[bestBrowser.toLowerCase() as keyof typeof percyBrowserPreference]) {
                    bestBrowser = currBrowserName
                    bestPlatformCaps = (caps.capabilities as WebdriverIO.Capabilities)
                }
            })
            return bestPlatformCaps
        }
    } catch (err) {
        PercyLogger.error(`Error while trying to determine best platform for Percy snapshot ${err}`)
        return null
    }
}
