import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { Capabilities } from '@wdio/types'

import { BROWSER_DESCRIPTION } from './constants.js'

/**
 * get browser description for Browserstack service
 * @param cap browser capablities
 */
export function getBrowserDescription(cap: Capabilities.DesiredCapabilities) {
    cap = cap || {}
    if (cap['bstack:options']) {
        cap = { ...cap, ...cap['bstack:options'] } as Capabilities.DesiredCapabilities
    }

    /**
     * These keys describe the browser the test was run on
     */
    return BROWSER_DESCRIPTION
        .map((k: keyof Capabilities.DesiredCapabilities) => cap[k])
        .filter(Boolean)
        .join(' ')
}

/**
 * get correct browser capabilities object in both multiremote and normal setups
 * @param browser browser object
 * @param caps browser capbilities object. In case of multiremote, the object itself should have a property named 'capabilities'
 * @param browserName browser name in case of multiremote
 */
export function getBrowserCapabilities(browser: Browser<'async'> | MultiRemoteBrowser<'async'>, caps?: Capabilities.RemoteCapability, browserName?: string) {
    if (!browser.isMultiremote) {
        return { ...browser.capabilities, ...caps }
    }

    const multiCaps = caps as Capabilities.MultiRemoteCapabilities
    const globalCap = browserName && browser[browserName] ? browser[browserName].capabilities : {}
    const cap = browserName && multiCaps[browserName] ? multiCaps[browserName].capabilities : {}
    return { ...globalCap, ...cap } as Capabilities.Capabilities
}

/**
 * check for browserstack W3C capabilities. Does not support legacy capabilities
 * @param cap browser capabilities
 */
export function isBrowserstackCapability(cap?: Capabilities.Capabilities) {
    return Boolean(cap && cap['bstack:options'])
}

export function getParentSuiteName(fullTitle: string, testSuiteTitle: string): string {
    const fullTitleWords = fullTitle.split(' ')
    const testSuiteTitleWords = testSuiteTitle.split(' ')
    const shortestLength = Math.min(fullTitleWords.length, testSuiteTitleWords.length)
    let c = 0
    let parentSuiteName = ''
    while (c < shortestLength && fullTitleWords[c] === testSuiteTitleWords[c]) {
        parentSuiteName += fullTitleWords[c++] + ' '
    }
    return parentSuiteName.trim()
}
