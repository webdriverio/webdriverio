import { BROWSER_DESCRIPTION } from './constants'

/**
 * get browser description for Browserstack service
 * @param {*} cap browser capablities
 */
export function getBrowserDescription(cap) {
    cap = cap || {}
    if (cap['bstack:options']) {
        cap = { ...cap, ...cap['bstack:options'] }
    }

    /**
     * These keys describe the browser the test was run on
     */
    return BROWSER_DESCRIPTION
        .map(k => cap[k])
        .filter(v => !!v)
        .join(' ')
}

/**
 * get correct browser capabilities object in both multiremote and normal setups
 * @param {*} caps browser capbilities object. In case of multiremote, the object itself should have a property named 'capabilities'
 * @param {*} browserName browser name in case of multiremote
 */
export function getBrowserCapabilities(caps, browserName) {
    if (!global.browser.isMultiremote) {
        return { ...global.browser.capabilities, ...caps }
    }

    const globalCap = global.browser[browserName] ? global.browser[browserName].capabilities : {}
    const cap = caps[browserName] ? caps[browserName].capabilities : {}
    return { ...globalCap, ...cap }
}

/**
 * check for browserstack W3C capabilities. Does not support legacy capabilities
 * @param {*} cap browser capabilities
 */
export function isBrowserstackCapability(cap) {
    return Boolean(cap && cap['bstack:options'])
}