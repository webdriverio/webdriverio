import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability } from '../src/util'

describe('getBrowserCapabilities', () => {
    it('should get default browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser'
            }
        }
        expect(getBrowserCapabilities(browser))
            .toEqual(browser.capabilities)
    })

    it('should get multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {
                capabilities: {
                    browser: 'browser'
                }
            }
        }
        expect(getBrowserCapabilities(browser, {}, 'browserA'))
            .toEqual(browser.browserA.capabilities)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        }
        expect(getBrowserCapabilities(browser, {}, 'browserB')).toEqual({})
    })

    it('should merge service capabilities and browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser',
                os: 'OS X',
            }
        }
        expect(getBrowserCapabilities(browser, { os: 'Windows' }))
            .toEqual({ os:'Windows', browser: 'browser' })
    })

    it('should merge multiremote service capabilities and browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {
                capabilities: {
                    browser: 'browser',
                    os: 'OS X',
                }
            }
        }
        expect(getBrowserCapabilities(browser, { browserA: { capabilities: { os: 'Windows' } } }, 'browserA'))
            .toEqual({ os:'Windows', browser: 'browser' })
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        }
        expect(getBrowserCapabilities(browser, {}, 'browserB'))
            .toEqual({})
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        }
        expect(getBrowserCapabilities(browser, { browserB: {} }, 'browserB'))
            .toEqual({})
    })
})

describe('getBrowserDescription', () => {
    const defaultCap = {
        'device': 'device',
        'os': 'os',
        'osVersion': 'osVersion',
        'browserName': 'browserName',
        'browser': 'browser',
        'browserVersion': 'browserVersion',
    }
    const defaultDesc = 'device os osVersion browserName browser browserVersion'
    const legacyCap = {
        'os_version': 'os_version',
        'browser_version': 'browser_version'
    }

    it('should get correct description for default capabilities', () => {
        expect(getBrowserDescription(defaultCap)).toEqual(defaultDesc)
    })

    it('should get correct description for legacy capabilities', () => {
        expect(getBrowserDescription(legacyCap)).toEqual('os_version browser_version')
    })

    it('should get correct description for W3C capabilities', () => {
        expect(getBrowserDescription({ 'bstack:options': defaultCap })).toEqual(defaultDesc)
    })

    it('should merge W3C and lecacy capabilities', () => {
        expect(getBrowserDescription({ 'bstack:options': defaultCap })).toEqual(defaultDesc)
    })

    it('should not crash when capabilities is null or undefined', () => {
        expect(getBrowserDescription(undefined)).toEqual('')
        expect(getBrowserDescription(null)).toEqual('')
    })
})

describe('isBrowserstackCapability', () => {
    it('should detect browserstack W3C capabilities', () => {
        expect(isBrowserstackCapability({})).toBe(false)
        expect(isBrowserstackCapability()).toBe(false)
        expect(isBrowserstackCapability({ 'bstack:options': null })).toBe(false)
        expect(isBrowserstackCapability({ 'bstack:options': {} })).toBe(true)
    })
})
