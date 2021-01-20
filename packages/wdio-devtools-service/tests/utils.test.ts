import type { Browser } from 'webdriverio'

import {
    sumByKey, isBrowserVersionLower, getBrowserMajorVersion,
    isBrowserSupported, setUnsupportedCommand
} from '../src/utils'
import { RequestPayload } from '../src/handler/network'

const expect = global.expect as any as jest.Expect

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('1234\nsomepath'),
    existsSync: jest.fn()
}))

test('sumByKey', () => {
    expect(sumByKey([{
        size: 1
    } as unknown as RequestPayload, {
        size: 2
    } as unknown as RequestPayload, {
        size: 3
    } as unknown as RequestPayload], 'size')).toBe(6)
})

test('setUnsupportedCommand', () => {
    const browser = { addCommand: jest.fn() }
    setUnsupportedCommand(browser as unknown as Browser)
    expect(browser.addCommand).toHaveBeenCalledWith('cdp', expect.any(Function))
    const fn = browser.addCommand.mock.calls[0][1]
    expect(fn).toThrow()
})

describe('isBrowserVersionLower', () => {
    test('should return false if version capability is missing', () => {
        expect(isBrowserVersionLower({} as any, 11)).toBe(false)
    })

    test('should return true if version is lower than required', () => {
        // @ts-expect-error invalid param
        expect(isBrowserVersionLower({ version: 62 }, 63)).toBe(true)
    })

    test('should return false if version is higher than required', () => {
        const versionProps = ['browserVersion', 'browser_version', 'version']
        let browserVersion = 63
        versionProps.forEach(prop => {
            const caps = {}
            caps[prop] = browserVersion
            expect(isBrowserVersionLower(caps, 63)).toBe(false)
            browserVersion++
        })
    })
})

describe('getChromeMajorVersion', () => {
    test('should return whatever value is passed if not a string', () => {
        expect(getBrowserMajorVersion({} as any)).toEqual({})
        expect(getBrowserMajorVersion(true as any)).toEqual(true)
        expect(getBrowserMajorVersion(78)).toEqual(78)
    })

    test('should return major version if proper version is passed', () => {
        expect(getBrowserMajorVersion('78.0.3904.11')).toEqual(78)
        expect(getBrowserMajorVersion('100.0')).toEqual(100)
        expect(getBrowserMajorVersion('78')).toEqual(78)
    })
})

describe('isBrowserSupported', () => {
    test('should return true when the browser and version are supported', () => {
        const caps = { browserName: 'Chromium', version: 80 }
        expect(isBrowserSupported(caps)).toEqual(true)
    })

    test('should return true when the browser and version are supported', () => {
        const caps = { browserName: 'Google Chrome', version: 80 }
        expect(isBrowserSupported(caps)).toEqual(true)
    })

    test('should return false when the browser us supported', () => {
        const capsFirefox = { browserName: 'firefox', version: 80 }
        expect(isBrowserSupported(capsFirefox)).toEqual(false)
    })

    test('should return false when the version is not supported', () => {
        const capsFirefox = { browserName: 'chrome', version: 50 }
        expect(isBrowserSupported(capsFirefox)).toEqual(false)
    })

    test('should return true when the browserName is not specified', () => {
        const capsEmpty = { version: 83 }
        // @ts-expect-error invalid param
        expect(isBrowserSupported(capsEmpty)).toEqual(false)
    })
    test('should return true when the version number is not specified', () => {
        const capsEmpty = { browserName: 'chrome' }
        expect(isBrowserSupported(capsEmpty)).toEqual(true)
    })
})
