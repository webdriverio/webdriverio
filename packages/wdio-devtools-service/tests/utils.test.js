import { sumByKey, isBrowserVersionLower, getBrowserMajorVersion, isBrowserSupported } from '../src/utils'

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('1234\nsomepath'),
    existsSync: jest.fn()
}))

test('sumByKey', () => {
    expect(sumByKey([{
        size: 1
    }, {
        size: 2
    }, {
        size: 3
    }], 'size')).toBe(6)
})

describe('isBrowserVersionLower', () => {
    test('should return false if version capability is missing', () => {
        expect(isBrowserVersionLower({})).toBe(false)
    })

    test('should return true if version is lower than required', () => {
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
        expect(getBrowserMajorVersion({})).toEqual({})
        expect(getBrowserMajorVersion(true)).toEqual(true)
        expect(getBrowserMajorVersion(78)).toEqual(78)
        expect(getBrowserMajorVersion('foobar')).toEqual('foobar')
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
        expect(isBrowserSupported(capsEmpty)).toEqual(false)
    })
    test('should return true when the version number is not specified', () => {
        const capsEmpty = { browserName: 'chrome' }
        expect(isBrowserSupported(capsEmpty)).toEqual(true)
    })
})
