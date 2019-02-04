/**
 *
 * Set capabilities for next session to be created by webdriverio.
 * Useful if it is required to change capabilities within test and then restore them
 *
 * <example>
    :setNextSessionCapabilities.js
    const origCapabilities = { browserName: 'firefox' }

    it('should set capabilities for next session', () => {
        console.log(browser.capabilities.browserName) // outputs: firefox
        browser.setNextSessionCapabilities({ browserName: 'chrome' })
        browser.reload()
        console.log(browser.capabilities.browserName) // outputs: chrome
    })

    after(() => {
        browser.setNextSessionCapabilities(origCapabilities)
    })
 * </example>
 *
 * @param {object} capabilities time in ms
 * @type utility
 *
 */

import { buildCapabilities } from 'webdriver/build/utils'

export default function setNextSessionCapabilities(capabilities) {
    if (capabilities) {
        let { w3cCaps, jsonwpCaps } = buildCapabilities(capabilities)

        this.options.requestedCapabilities.w3cCaps = w3cCaps
        this.options.requestedCapabilities.jsonwpCaps = jsonwpCaps
    } else {
        throw new Error('Capabilities object is required (see https://webdriver.io/docs/api/browser/setNextSessionCapabilities.html for documentation.')
    }
}
