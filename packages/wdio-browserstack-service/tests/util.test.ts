import { describe, expect, it } from 'vitest'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import {
    getBrowserDescription,
    getBrowserCapabilities,
    isBrowserstackCapability,
    getParentSuiteName
} from '../src/util'

describe('getBrowserCapabilities', () => {
    it('should get default browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser'
            }
        } as Browser
        expect(getBrowserCapabilities(browser))
            .toEqual(browser.capabilities as any)
    })

    it('should get multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {
                capabilities: {
                    browser: 'browser'
                }
            }
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserA'))
            .toEqual(browser.browserA.capabilities as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB')).toEqual({})
    })

    it('should merge service capabilities and browser capabilities', () => {
        const browser = {
            capabilities: {
                browser: 'browser',
                os: 'OS X',
            }
        } as any as Browser
        expect(getBrowserCapabilities(browser, { os: 'Windows' }))
            .toEqual({ os:'Windows', browser: 'browser' } as any)
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
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, { browserA: { capabilities: { os: 'Windows' } } }, 'browserA'))
            .toEqual({ os:'Windows', browser: 'browser' } as any)
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, {}, 'browserB'))
            .toEqual({})
    })

    it('should handle null multiremote browser capabilities', () => {
        const browser = {
            isMultiremote: true,
            browserA: {}
        } as any as MultiRemoteBrowser
        expect(getBrowserCapabilities(browser, { browserB: {} } as any, 'browserB'))
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
        // @ts-expect-error test invalid params
        expect(getBrowserDescription(undefined)).toEqual('')
        // @ts-expect-error test invalid params
        expect(getBrowserDescription(null)).toEqual('')
    })
})

describe('isBrowserstackCapability', () => {
    it('should detect browserstack W3C capabilities', () => {
        expect(isBrowserstackCapability({})).toBe(false)
        expect(isBrowserstackCapability()).toBe(false)
        // @ts-expect-error test invalid params
        expect(isBrowserstackCapability({ 'bstack:options': null })).toBe(false)
        expect(isBrowserstackCapability({ 'bstack:options': {} })).toBe(true)
    })
})

describe('getParentSuiteName', () => {
    it('should return the parent suite name', () => {
        expect(getParentSuiteName('foo bar', 'foo')).toBe('foo')
        expect(getParentSuiteName('foo', 'foo bar')).toBe('foo')
        expect(getParentSuiteName('foo bar', 'foo baz')).toBe('foo')
        expect(getParentSuiteName('foo bar', 'foo bar')).toBe('foo bar')
    })

    it('should return empty string if no common parent', () => {
        expect(getParentSuiteName('foo bar', 'baz bar')).toBe('')
    })

    it('should handle empty values', () => {
        expect(getParentSuiteName('', 'foo')).toBe('')
        expect(getParentSuiteName('foo', '')).toBe('')
    })
})
