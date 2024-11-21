import { describe, it, expect } from 'vitest'
import { getMobileContext, getNativeContext } from '../../src/utils/mobile.js'

describe('getNativeContext', () => {
    it('should return false if capabilities are missing', () => {
        // @ts-expect-error
        expect(getNativeContext({ isMobile: true })).toBe(false)
    })

    it('should return false if `isMobile` is false', () => {
        const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile: false })).toBe(false)
    })

    it('should return true if Appium app capabilities are present and valid', () => {
        const capabilities = {
            app: '/path/to/app.apk',
            browserName: undefined,
            autoWebview: false
        } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile: true })).toBe(true)
    })

    it('should return false if Appium app capabilities are present but `autoWebview` is true', () => {
        const capabilities = {
            app: '/path/to/app.apk',
            browserName: undefined,
            autoWebview: true
        } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile:true })).toBe(false)
    })

    it('should return false if `browserName` is defined', () => {
        const capabilities = {
            app: '/path/to/app.apk',
            browserName: 'chrome',
            autoWebview: false
        } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile: true })).toBe(false)
    })
})

describe('getMobileContext', () => {
    it('should return `NATIVE_APP` if `isNativeContext` is true', () => {
        const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities

        expect(getMobileContext({ capabilities, isAndroid: false, isNativeContext: true })).toBe('NATIVE_APP')
    })

    it('should return `CHROMIUM` if Android and browserName is `chrome`', () => {
        const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
        expect(getMobileContext({ capabilities, isAndroid: true, isNativeContext: false })).toBe('CHROMIUM')
    })

    it('should return undefined if not Android or not `chrome`', () => {
        const capabilities = { browserName: 'safari' } as WebdriverIO.Capabilities
        expect(getMobileContext({ capabilities, isAndroid: true, isNativeContext: false })).toBeUndefined()
        expect(getMobileContext({ capabilities, isAndroid: false, isNativeContext: false })).toBeUndefined()
    })

    it('should return undefined for iOS contexts regardless of browserName', () => {
        const capabilities = { browserName: 'chrome' } as WebdriverIO.Capabilities
        expect(getMobileContext({ capabilities, isAndroid: false, isNativeContext: false })).toBeUndefined()
    })
})
