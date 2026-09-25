import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { calculateAndroidPinchAndZoomSpeed, executeMobile, getMobileContext, getNativeContext, validatePinchAndZoomOptions } from '../../src/utils/mobile.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

import type { PinchAndZoomOptions } from '../../src/types.js'

function mockBrowser(executeScript: ReturnType<typeof vi.fn>) {
    return { executeScript } as unknown as WebdriverIO.Browser
}

describe(executeMobile, () => {
    it('returns the executeScript result', async () => {
        const executeScript = vi.fn().mockResolvedValue('ok')
        await expect(executeMobile(mockBrowser(executeScript), 'mobile: lock', { seconds: 1 })).resolves.toBe('ok')
        expect(executeScript).toHaveBeenCalledWith('mobile: lock', [{ seconds: 1 }])
    })

    it('calls executeScript with an empty args list when none are provided', async () => {
        const executeScript = vi.fn().mockResolvedValue(undefined)
        await executeMobile(mockBrowser(executeScript), 'mobile: shake')
        expect(executeScript).toHaveBeenCalledWith('mobile: shake', [])
    })

    it('rethrows non-unknown-method errors', async () => {
        const executeScript = vi.fn().mockRejectedValue(new Error('device disconnected'))
        await expect(executeMobile(mockBrowser(executeScript), 'mobile: lock', {})).rejects.toThrow('device disconnected')
    })

    it('throws an Appium 3 upgrade error for unknown method', async () => {
        const executeScript = vi.fn().mockRejectedValue(new Error('unknown method: mobile: lock'))
        await expect(executeMobile(mockBrowser(executeScript), 'mobile: lock', {})).rejects.toThrow(/requires Appium 3/)
        await expect(executeMobile(mockBrowser(executeScript), 'mobile: lock', {})).rejects.toThrow(/unknown method: mobile: lock/)
        await expect(executeMobile(mockBrowser(executeScript), 'mobile: lock', {})).rejects.toThrow(/may not implement/)
    })

    it('throws an Appium 3 upgrade error for unknown command', async () => {
        const executeScript = vi.fn().mockRejectedValue(new Error('Unknown Command'))
        await expect(executeMobile(mockBrowser(executeScript), 'mobile: shake', {})).rejects.toThrow(/appium@\^3/)
    })
})

describe(getNativeContext, () => {
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

    it('should return true if Appium app capabilities are present using "appium:options" and valid', () => {
        const capabilities = {
            browserName: undefined,
            autoWebview: false,
            'appium:options': {
                app: '/path/to/app.apk'
            }
        } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile: true })).toBe(true)
    })

    it('should return false if Appium app capabilities are present using "appium:options", but `autoWebview` is true', () => {
        const capabilities = {
            browserName: undefined,
            'appium:options': {
                app: '/path/to/app.apk',
                autoWebview: true,
            }
        } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile: true })).toBe(false)
    })

    it('should return true if Appium app capabilities are present using "lt:options" and valid', () => {
        const capabilities = {
            browserName: undefined,
            autoWebview: false,
            'lt:options': {
                app: '/path/to/app.apk'
            }
        } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile: true })).toBe(true)
    })

    it('should return false if Appium app capabilities are present using "lt:options", but `autoWebview` is true', () => {
        const capabilities = {
            browserName: undefined,
            'lt:options': {
                app: '/path/to/app.apk',
                autoWebview: true,
            }
        } as WebdriverIO.Capabilities
        expect(getNativeContext({ capabilities, isMobile: true })).toBe(false)
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

describe(getMobileContext, () => {
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

describe(calculateAndroidPinchAndZoomSpeed, () => {
    it('uses defaults', () => {
        const mockBrowserWithoutScreenSize = {
            capabilities: {},
        }
        const result = calculateAndroidPinchAndZoomSpeed({
            browser: mockBrowserWithoutScreenSize as unknown as WebdriverIO.Browser,
            duration: 1000,
            scale: 0.5,
        })
        expect(result).toEqual(804)
    })

    it('calculates speed correctly with provided screen size', () => {
        const mockBrowser = {
            capabilities: {
                deviceScreenSize: '1440x3200',
            },
        }
        const result = calculateAndroidPinchAndZoomSpeed({
            browser: mockBrowser as unknown as WebdriverIO.Browser,
            duration: 1000,
            scale: 0.5,
        })
        expect(result).toBeGreaterThan(0)
        expect(result).toEqual(1073)
    })
})

describe(validatePinchAndZoomOptions, () => {
    const mockBrowserMobile = {
        isMobile: true,
        isIOS: false,
    }
    const mockBrowserIOS = {
        isMobile: true,
        isIOS: true,
    }

    it('returns default values for valid inputs with no options', () => {
        const result = validatePinchAndZoomOptions({
            browser: mockBrowserMobile as unknown as WebdriverIO.Browser,
            gesture: 'pinch',
            options: {},
        })
        expect(result).toEqual({
            scale: 0.5,
            duration: 1500,
        })
    })

    it('handles default values for iOS', () => {
        const result = validatePinchAndZoomOptions({
            browser: mockBrowserIOS as unknown as WebdriverIO.Browser,
            gesture: 'pinch',
            options: {},
        })
        expect(result).toEqual({
            scale: 0.5,
            duration: 1.5,
        })
    })

    it('handles valid scale and duration', () => {
        const result = validatePinchAndZoomOptions({
            browser: mockBrowserMobile as unknown as WebdriverIO.Browser,
            gesture: 'pinch',
            options: { scale: 0.75, duration: 2000 },
        })
        expect(result).toEqual({
            scale: 0.75,
            duration: 2000,
        })
    })

    it('handles valid scale and duration for iOS', () => {
        const result = validatePinchAndZoomOptions({
            browser: mockBrowserIOS as unknown as WebdriverIO.Browser,
            gesture: 'zoom',
            options: { scale: 0.75, duration: 2000 },
        })
        expect(result).toEqual({
            scale: 7.5,
            duration: 2.0,
        })
    })

    it('throws for invalid scale values', () => {
        expect(() => {
            validatePinchAndZoomOptions({
                browser: mockBrowserMobile as unknown as WebdriverIO.Browser,
                gesture: 'pinch',
                options: { scale: -0.1 },
            })
        }).toThrow("The 'scale' option must be a number between 0 and 1")
    })

    it('throws for invalid duration values', () => {
        expect(() => {
            validatePinchAndZoomOptions({
                browser: mockBrowserMobile as unknown as WebdriverIO.Browser,
                gesture: 'pinch',
                options: { duration: 200 },
            })
        }).toThrow("The 'duration' option must be between 500 and 10000 ms")
    })

    it('throws for invalid options object', () => {
        expect(() => {
            validatePinchAndZoomOptions({
                browser: mockBrowserMobile as unknown as WebdriverIO.Browser,
                gesture: 'pinch',
                options: [] as unknown as Partial<PinchAndZoomOptions>,
            })
        }).toThrow('Options must be an object')
    })
})
